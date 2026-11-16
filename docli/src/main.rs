use std::env;
mod push_image;
mod structures;
use push_image::push;

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
        "push"=>{push(&args[2])},
        "pull"=>{},
        _=>{}
    }
}


