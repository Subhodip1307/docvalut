use crate::structures::{ConfigJson, DockerManifest, LayerSource, ManifestPayload};
use docli::{Ac, separate_tag_n_image};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tar::Builder;
use uuid::Uuid;

const EXPORT_PATH: &str = "/tmp/dockervault/download";
const BASE_DOMAIN: &str = "http://127.0.0.1:9000/v1/pull/";

pub fn pull(image_reference: &str) {
    let (image, tag) = separate_tag_n_image(image_reference);
    let client = reqwest::blocking::Client::new();
    let manifest = match fetch_manifest(client.clone(), image.clone(), tag) {
        Ok(v) => v,
        Err(e) => {
            println!("error in fetch_manifest: {e}");
            return;
        }
    };
    let working_path = genarate_path();
    // downloading config
    let config_filename = format!("{}.json", manifest.config.digest.split_once(":").unwrap().1);
    let config_path = working_path.join(&config_filename);
    if let Err(e) = download_blob(
        client.clone(),
        &manifest.config.digest,
        &config_path,
        image.clone(),
    ) {
        eprint!("Error in downloading config {e}");
    };

    let indexs = match create_indexs(&config_path) {
        Ok(v) => v,
        Err(e) => {
            println!("error in create index {e}");
            return;
        }
    };
    let layer_paths = download_all_manifest(client, manifest.layers, &working_path, indexs, image);
    // Create Docker save manifest.json
    let docker_manifest = vec![DockerManifest {
        config: config_filename,
        repo_tags: vec!["mongo:9".to_string()],
        layers: layer_paths,
    }];
    let json = serde_json::to_string_pretty(&docker_manifest).unwrap();
    std::fs::write(working_path.join("manifest.json"), json).unwrap();
    println!("the working path was {working_path:?}");
    // making a zip
    let file = File::create(working_path.with_extension("tar")).unwrap();
    let mut archive = Builder::new(file);
    archive.append_dir_all(".", working_path).unwrap();
    archive.finish().unwrap();
}

fn genarate_path() -> PathBuf {
    let new_path = Path::new(&format!("{EXPORT_PATH}/{}", Uuid::new_v4())).to_owned();
    std::fs::create_dir_all(&new_path).unwrap();
    new_path
}

fn fetch_manifest(
    client: Ac,
    image: Arc<String>,
    tag: Arc<String>,
) -> Result<ManifestPayload, reqwest::Error> {
    let res = client
        .get(format!(
            "{BASE_DOMAIN}manifests/?repository={image}&reference={tag}"
        ))
        .send()
        .unwrap();
    res.json::<ManifestPayload>()
}

fn download_blob(
    client: Ac,
    digest: &str,
    desination: &Path,
    image: Arc<String>,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut res = client
        .get(format!(
            "{BASE_DOMAIN}blobs/?repository={image}&digest={digest}"
        ))
        .send()
        .unwrap();
    // file
    let mut file = File::create(desination)?;
    let mut buffer = [0u8; 1024 * 1024];
    let mut hasher = Sha256::new();
    loop {
        let n = res.read(&mut buffer)?;
        if n == 0 {
            break; // EOF: stream finished
        }
        hasher.update(&buffer[..n]);
        file.write_all(&buffer[..n])?;
    }
    let actual = format!("sha256:{}", hex::encode(hasher.finalize()));
    if actual != digest {
        return Err(format!("Digest mismatch: expected {digest}, got {actual}").into());
    }
    Ok(())
}

fn create_indexs(config_path: &Path) -> Result<HashMap<String, usize>, Box<dyn std::error::Error>> {
    // read the diff_ids from the config file json and create an index out of that
    let content = fs::read_to_string(config_path)?;
    let config: ConfigJson = serde_json::from_str(&content)?;
    let mut hash_indexs: HashMap<String, usize> = HashMap::new();
    for (i, v) in config.get_ids().iter().enumerate() {
        hash_indexs.insert(v.clone(), i);
    }
    Ok(hash_indexs)
}

fn download_all_manifest(
    client: Ac,
    layers: Vec<LayerSource>,
    wdir: &Path,
    indexs: HashMap<String, usize>,
    image: Arc<String>,
) -> Vec<String> {
    let mut layers_path = vec![String::new(); layers.len()];
    for v in layers {
        let i = indexs.get(&v.digest).unwrap(); //TODO: handel errro
        let layer_dir = wdir.join(format!("layer-{i}"));
        std::fs::create_dir_all(&layer_dir).unwrap();
        let layer_path = layer_dir.join("layer.tar");
        if let Err(e) = download_blob(client.clone(), &v.digest, &layer_path, image.clone()) {
            eprint!("Error in downloading layers number {i}:  {e}");
        };
        layers_path[*i] = format!("layer-{i}/layer.tar");
    }
    layers_path
}
