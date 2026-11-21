use std::env;
mod login;
mod pull_image;
mod push_image;
mod structures;
use pull_image::pull;
use push_image::push;
use login::init_login;

fn print_usage(program: &str) {
    println!("Usage:");
    println!("  {program} push <Image:Tag> Pushing New Image");
    println!("  {program} Pull <Image:Tag> Pulling a New Image");
    println!("Default Tag is 'latest' ");
}

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() <= 1 {
        println!("Error: no command given.\n");
        print_usage(&args[0]);
        return;
    }

    match args[1].as_str() {
        "push" => push(&args[2]),
        "pull" => pull(&args[2]),
        "login"=>init_login(),
        _ => {}
    }
}
