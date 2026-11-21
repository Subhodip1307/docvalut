use core::str;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct Manifest {
    pub config: String,
    pub layer_sources: HashMap<String, LayerSource>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LayerSource {
    #[serde(rename = "mediaType")]
    pub media_type: String,
    pub size: u64,
    pub digest: String,
}

pub struct ApiData {
    pub image_name: Arc<String>,
    pub digest: String,
    pub file_path: Arc<PathBuf>, //actually the folder path
    pub config_layer: LayerSource,
    pub all_layers: Vec<LayerSource>,
    pub tag: Arc<String>,
}
impl ApiData {
    pub fn get_path(&self) -> PathBuf {
        let hash = self.digest.split(":").collect::<Vec<&str>>()[1];
        // println!("the previos");
        self.file_path.join(format!("blobs/sha256/{}", hash))
    }
    pub fn get_tag(&self) -> &str {
        &self.tag
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManifestPayload {
    pub schema_version: i8,
    pub media_type: String,
    pub config: LayerSource,      //keep the Config layer info
    pub layers: Vec<LayerSource>, //keep the all LayerSources here except the Config
}
impl ManifestPayload {
    pub fn new(config: LayerSource, layers: Vec<LayerSource>) -> Self {
        Self {
            schema_version: 2,
            media_type: "application/vnd.oci.image.manifest.v1+json".to_string(),
            config,
            layers,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct DockerManifest {
    // manifest for saving docker
    pub config: String,
    pub repo_tags: Vec<String>,
    pub layers: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct Diffids {
    diff_ids: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct ConfigJson {
    // read and parse the downloaded config json
    rootfs: Diffids,
}
impl ConfigJson {
    pub fn get_ids(&self) -> &Vec<String> {
        &self.rootfs.diff_ids
    }
}
