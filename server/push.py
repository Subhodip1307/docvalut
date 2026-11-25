import subprocess,os
import tarfile,json
from pathlib import Path
import requests
from urllib.parse import urljoin

EXPORT_PATH=Path("/tmp/Moorage")
BASE_DOMAIN="http://localhost:8000/v1/"
IMAGE_NAME='mongo'
PUSHING_TAG="latest"

def get_docker_image(image:str):
    print(f"Exporting local image {image} ...")
    os.makedirs(EXPORT_PATH,exist_ok=True)
    subprocess.run(
        ["docker", "image", "save", "--output", EXPORT_PATH.joinpath("image.tar"), image],
        check=True,
    )

def unzip_image():
    with tarfile.open(EXPORT_PATH.joinpath("image.tar"), "r") as tar:
        tar.extractall(path=EXPORT_PATH.joinpath("image"))
    os.remove(EXPORT_PATH.joinpath("image.tar"))


def read_manifest():
    with open(EXPORT_PATH.joinpath("image/manifest.json"), 'r', encoding='utf-8') as file:
        data = json.load(file)
        return data[0]


# get_docker_image(IMAGE_NAME)
# unzip_image()
config=read_manifest()
all_layers:list=list(config["LayerSources"].values())
config_path = EXPORT_PATH / "image" / config["Config"]
config_meta={
    "digest": f"sha256:{config_path.name}",
    "size": config_path.stat().st_size,
    "mediaType": "application/vnd.oci.image.config.v1+json"
}
all_layers.append(config_meta)
for v in all_layers:
    _,hash= v["digest"].split(":")
    size = v["size"]
    file_path=EXPORT_PATH.joinpath('image/blobs/sha256').joinpath(hash)
    #Check_Blob
    res=requests.head(f"{BASE_DOMAIN}push/{IMAGE_NAME}/blobs/{(v["digest"])}")
    if res.status_code!=404:
        continue
    print("creating session to upload")
    res=requests.post(f"{BASE_DOMAIN}push/{IMAGE_NAME}/blobs/uploads/",data={})
    if res.status_code!=202:
        print("something went wrong ")
        continue
    sessions_headers=res.headers
    sessions_id=sessions_headers["Docker-Upload-UUID"]
    # print("the headers : ",res.headers)
    print("\n========== PATCH UPLOAD ==========")
    upload_location=joined = urljoin(BASE_DOMAIN, sessions_headers["Location"])
    print("the upload location url is ",upload_location)    
    with open(file_path, "rb") as file:
        response = requests.patch(
            upload_location,
            data=file,
            headers={"Content-Type": "application/octet-stream"}
        )
    print(response.status_code)
    print(response.text)
    print("\n========== FINALIZE BLOB UPLOAD ==========")
    res=requests.put(f"{BASE_DOMAIN}push/{IMAGE_NAME}/blobs/uploads/{sessions_id}?digest={(v["digest"])}",data={})
    if res.status_code!=201:
        print("something went wrong at line 65")
    print("now uploading manifest")
    manifest={
    "schemaVersion": 2,
    "mediaType": "application/vnd.oci.image.manifest.v1+json",
    "config": config_meta,"layers": list(config["LayerSources"].values())}

    manifest_bytes = json.dumps(
    manifest, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")

    res=requests.put(f"{BASE_DOMAIN}push/{IMAGE_NAME}/manifests/{PUSHING_TAG}",data=manifest_bytes)
    print(res.status_code)




