use keyring::Entry;
// also check the auth token

pub fn init_login(token:&String){
    if let  Err(e)=save_cread(token){
        println!("Error: {}", e);
        return;
    }
    println!("Credential Saved")

}

fn save_cread(token:&String) -> Result<(), Box<dyn std::error::Error>>{
    let entry = Entry::new("Moorage", "Etheric_Sea")?;
    entry.set_password(token)?;
    Ok(())
}