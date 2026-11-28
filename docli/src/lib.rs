use std::sync::Arc;
use reqwest::{header::{AUTHORIZATION, HeaderMap, HeaderValue, USER_AGENT}};
use std::time::Duration;
use keyring::Entry;

pub type Ac = reqwest::blocking::Client;

pub fn separate_tag_n_image(image_reference: &str) -> (Arc<String>, Arc<String>) {
    let (image, tag) = image_reference
        .split_once(":")
        .unwrap_or((image_reference, "latest"));
    (Arc::new(image.to_string()), Arc::new(tag.to_string()))
}



pub fn init_client()->Ac{
    if  get_auth_token().is_err(){
        println!("token not found, Please login first");
        std::process::exit(0);
    }
    let mut headers = HeaderMap::new();
    headers.insert(USER_AGENT, HeaderValue::from_static("Moorage/1.0"));
    headers.insert(AUTHORIZATION, HeaderValue::from_str(&format!("Bearer {}",get_auth_token().unwrap())).unwrap());
   reqwest::blocking::Client::builder()
    .default_headers(headers)            // sent with every request
    .timeout(Duration::from_secs(10))    // whole-request timeout
    .connect_timeout(Duration::from_secs(5)) // optional: connect phase only
    .build().unwrap()
}

pub fn get_auth_token() -> Result<String, Box<dyn std::error::Error>>{
    let entry = Entry::new("Moorage", "Etheric_Sea")?;
    let token=entry.get_password()?;
    Ok(token)
}