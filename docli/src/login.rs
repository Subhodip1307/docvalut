use std::env;
use std::fs::{self, File};
use std::path::PathBuf;

pub fn init_login(){
    check_or_create_file();
}

fn check_or_create_file()->bool {
    let base_path: PathBuf = env::var_os("HOME").unwrap().into();
    let config_path = base_path.join(".config/.docli/config.toml");
    if config_path.exists() {
        true
        } else {
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent).unwrap();
        }
        File::create(config_path).unwrap();
        false
    }
}
