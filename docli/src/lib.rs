use std::sync::Arc;
pub type Ac = reqwest::blocking::Client;

pub fn separate_tag_n_image(image_reference: &str) -> (Arc<String>, Arc<String>) {
    let (image, tag) = image_reference
        .split_once(":")
        .unwrap_or((image_reference, "latest"));
    (Arc::new(image.to_string()), Arc::new(tag.to_string()))
}
