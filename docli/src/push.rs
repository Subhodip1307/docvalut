use std::path::{Path,PathBuf};
use uuid::Uuid;
use std::fs::File;


const EXPORT_PATH:&str="/tmp/dockervault";
const BASE_DOMAIN:&str="/tmp/dockervault";


fn pull(image_reference:&str){
    // ex : image_reference :- "mongo:v1"  or "mongo"
}


fn separate_tag_n_image(image_reference:&str)->(&str,&str){
    image_reference.split_once(":").map_or((image_reference,"latest"), |p|p)
}

fn pull_image(image_reference:&str)-> Result<PathBuf, Box<dyn std::error::Error>>{
        let client = reqwest::blocking::Client::builder()
        .unix_socket("/var/run/docker.sock")
        .timeout(None) // big images take a while; default is 30s
        .build()?;

    let image_export_path=Path::new(EXPORT_PATH).join(Uuid::new_v4().to_string());

    let mut resp = client
        .get(&format!("http://localhost/images/{}/get",image_reference))
        .send()?
        .error_for_status()?;

    let mut file = File::create(&image_export_path)?;
    resp.copy_to(&mut file)?; // streams to disk, doesn't load it all into memory
    Ok(image_export_path)
}

fn unzip_image(){}