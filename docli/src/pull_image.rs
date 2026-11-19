use std::path::{Path,PathBuf};
use uuid::Uuid;
use crate::structures::ManifestPayload;
type Ac = reqwest::blocking::Client;


const EXPORT_PATH: &str = "/tmp/dockervault/download";
const BASE_DOMAIN: &str = "http://127.0.0.1:8000/v1/pull/";

pub fn pull(_image_reference: &str){
    let client = reqwest::blocking::Client::new();
    let manifest= match fetch_manifest(client.clone()){
        Ok(v)=>v,
        Err(e)=>{println!("error in fetch_manifest: {e}");return;}
    };

}

fn genarate_path()->PathBuf{
    let new_path= Path::new(&format!("{EXPORT_PATH}/{}",Uuid::new_v4())).to_owned();
    std::fs::create_dir_all(&new_path).unwrap();
    new_path
}

fn fetch_manifest(client:Ac)->Result<ManifestPayload, reqwest::Error>{
    let res=client.get(
        format!("{BASE_DOMAIN}mongo/manifests/9/")
    ).send().unwrap();
    res.json::<ManifestPayload>()
}

fn download_blob(digest:&str,desination:&Path){
    
}