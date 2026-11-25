use crate::structures::{ApiData, LayerSource, Manifest, ManifestPayload};
use moor::{Ac, separate_tag_n_image,init_client};
use rayon::prelude::*;
use reqwest::StatusCode;
use std::fs::{File,self};
use std::thread;
use std::{
    cmp::min,
    path::{Path, PathBuf},
    sync::Arc,
};
use tar::Archive;
use uuid::Uuid;

const EXPORT_PATH: &str = "/tmp/Moorage/download";
const BASE_DOMAIN: &str = "http://127.0.0.1:8000/v1/";

/*
TODO:
1.Improve error handeling,
*/

pub fn push(image_reference: &str) {
    std::fs::create_dir_all(EXPORT_PATH).unwrap();
    // ex : image_reference :- "mongo:v1"  or "mongo"
    let exported_path = match pull_image(image_reference) {
        Ok(p) => p,
        Err(e) => {
            println!("error in 17 {e}");
            return;
        }
    }; // contains full path of the exported folder

    match unzip_image(&exported_path) {
        Ok(_) => {
            if let Err(e)=read_manifest(&exported_path, image_reference){
                println!("{e}");
            };
        }
        Err(e) => {
            eprintln!("{e}");
        },
    }
    clear_file(exported_path);
}

fn pull_image(image_reference: &str) -> Result<PathBuf, Box<dyn std::error::Error>> {
    let client = reqwest::blocking::Client::builder()
        .unix_socket("/var/run/docker.sock")
        .timeout(None) // big images take a while; default is 30s
        .build()?;

    let image_export_path = Path::new(EXPORT_PATH).join(format!("{}.tar", Uuid::new_v4()));

    let mut resp = client
        .get(format!("http://localhost/images/{}/get", image_reference))
        .send()?
        .error_for_status()?;

    let mut file = File::create(&image_export_path)?;
     
    match resp.copy_to(&mut file){
        Err(e)=>{
            clear_file(image_export_path);
            return  Err(Box::new(e))
        },
        Ok(_)=>{},
    }; // streams to disk, doesn't load it all into memory
    Ok(image_export_path.with_extension(""))
}

fn clear_file(file_path:PathBuf){
    let _=fs::remove_dir_all(&file_path);
    let _=fs::remove_file(file_path.with_extension("tar"));

}

fn unzip_image(package_path: &Path) -> std::io::Result<()> {
    println!(
        "the path to extrac is {:?}",
        package_path.with_extension("tar")
    );
    let mut archive = Archive::new(File::open(package_path.with_extension("tar"))?);
    archive.unpack(package_path)?;
    Ok(())
}

fn read_manifest(
    image_path: &Path,
    image_reference: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let file = File::open(image_path.join("manifest.json"))?;
    let manifests: Vec<Manifest> = serde_json::from_reader(file)?;
    let client = init_client();
    let (image_name, tag) = separate_tag_n_image(image_reference);
    let m: &Manifest = &manifests[0];
    let config_layer = create_config_layer(image_path, &m.config);
    // println!("config: {}", m.config);
    let all_layers: Vec<LayerSource> = m.layer_sources.values().cloned().collect();
    let folder_path = Arc::new(image_path.to_path_buf());

    let thread_count = {
        let cores = thread::available_parallelism()
            .map(|n| n.get())
            .unwrap_or(1);
        min(cores, all_layers.len())
    };
    let mut all_layers_iter = all_layers.clone();
    all_layers_iter.push(config_layer.clone());

    let pool = rayon::ThreadPoolBuilder::new()
        .num_threads(thread_count) // your computed value
        .build()
        .unwrap();
    pool.install(|| {
        all_layers_iter.par_iter().for_each(|layer| {
            let data = ApiData {
                tag: tag.clone(),
                image_name: image_name.clone(),
                digest: layer.digest.clone(),
                file_path: folder_path.clone(),
                config_layer: config_layer.clone(),
                all_layers: all_layers.clone(),
            };

            if let Err(e) = push_api_collections(client.clone(), data) {
                println!("{}", e);
            }
        });
    });
    // ToDO need to write code to delete the folder and it's tar

    Ok(())
}

fn create_config_layer(image_path: &Path, config: &str) -> LayerSource {
    let config_path = image_path.join(config);
    let digest = config_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("");
    let size = std::fs::metadata(&config_path).unwrap().len();
    LayerSource {
        digest: format!("sha256:{}", digest),
        size,
        media_type: "application/vnd.oci.image.config.v1+json".into(),
    }
}

fn push_api_collections(api_client: Ac, data: ApiData) -> Result<(), Box<dyn std::error::Error>> {
    // check blob
    let res = api_client
        .head(format!(
            "{BASE_DOMAIN}push/{IMAGE_NAME}/blobs/{digest}",
            IMAGE_NAME = data.image_name,
            digest = data.digest
        ))
        .send()?;
    if res.status() != StatusCode::NOT_FOUND {
        return Ok(());
    }
    println!("========== Session create ==========");
    // creating session to upload
    let res = api_client
        .post(format!(
            "{BASE_DOMAIN}push/{IMAGE_NAME}/blobs/uploads/",
            IMAGE_NAME = data.image_name
        ))
        .send()?;
    if res.status() != StatusCode::ACCEPTED {
        return Err("Something went wrong in session create".into());
    }
    let sessions_headers_id = res.headers().get("Docker-Upload-UUID");
    let sessions_id = match sessions_headers_id {
        Some(v) => v,
        None => return Err("Docker upload ID not found".into()),
    };
    println!("========== PATCH UPLOAD ==========");
    println!("the paht is {:?}", data.get_path());
    let file = File::open(data.get_path())?;

    let res = api_client
        .patch(format!(
            "{BASE_DOMAIN}push/{IMAGE_NAME}/blobs/uploads/{upload_uuid}",
            IMAGE_NAME = data.image_name,
            upload_uuid = sessions_id.to_str().unwrap()
        ))
        .header("Content-Type", "application/octet-stream")
        .body(file)
        .send()?;

    println!("{}", res.status());
    println!("{}", res.text()?);
    println!("========== FINALIZE BLOB UPLOAD ==========");
    let res = api_client
        .put(format!(
            "{BASE_DOMAIN}push/{IMAGE_NAME}/blobs/uploads/{upload_uuid}?digest={digest}",
            IMAGE_NAME = data.image_name,
            upload_uuid = sessions_id.to_str().unwrap(),
            digest = data.digest
        ))
        .send()?;

    if res.status() != StatusCode::CREATED {
        return Err("something went wrong at line 112".into());
    }
    println!("now uploading manifest");
    let url = format!(
        "{BASE_DOMAIN}push/{}/manifests/{}",
        data.image_name,
        data.get_tag()
    );
    let menifest = ManifestPayload::new(data.config_layer, data.all_layers);

    let res = api_client.put(url).json(&menifest).send()?;

    println!("the final status code {}", res.status());
    Ok(())
}
