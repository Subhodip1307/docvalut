<div align="center">

# ⚓ Moorage

**An open-source, self-hosted container image registry, with its own CLI and web UI.**

*Where your images come to rest.*

![Status](https://img.shields.io/badge/status-under%20construction-orange)
![Python](https://img.shields.io/badge/python-3.x-blue)
![Django](https://img.shields.io/badge/django-DRF-green)
![Rust](https://img.shields.io/badge/CLI-rust-b7410e)
![OCI](https://img.shields.io/badge/OCI-images-lightgrey)

</div>

---

> 🚧 **Under construction**
>
> Moorage is in early, active development. APIs, CLI commands and the database schema may change without notice.
> Do not use it in production yet. Feedback, ideas and contributions are very welcome.

---

## What is Moorage?

A *moorage* is a place where ships are tied up and kept safe.
Moorage does the same for your container images. It is a registry you host yourself, so you can push, store and pull Docker/OCI images without depending on a third-party hub.

It comes with:

- **A registry backend** for storing and serving Docker/OCI images
- **The `moor` CLI** to log in, push and pull images
- **A web UI** to browse repositories, tags and manifests

## Features

| Feature | Status |
|---|---|
| Push images | ✅ Working |
| Pull images | ✅ Working |
| Authentication (login) | ✅ Working |
| Web UI: browse repositories, tags, manifests | 🛠️ In progress |
| Create and manage repositories from the UI | 🛠️ In progress |
| **Sonar**: image vulnerability scanning | 🔭 Planned |
| **Shipyard**: cloud image builds | 🔭 Planned |

## Tech stack

- **Backend:** Python, Django, Django REST Framework
- **Storage:** image blobs on the local filesystem, metadata in the database
- **Frontend:** Django templates with plain JavaScript
- **CLI:** `moor`, written in Rust

## Getting started

Moorage is not ready to use yet. Installation and usage guides will be added once the first release is ready.

## Roadmap

- [x] Core registry: push and pull
- [x] Authentication
- [x] `moor` CLI: login, push, pull
- [ ] Complete web UI
- [ ] Full installation and configuration docs
- [ ] **Sonar**: vulnerability scanning for stored images
- [ ] **Shipyard**: build images in the cloud straight from your source

## Contributing

Moorage is open source and contributions are welcome, even at this early stage.

1. Fork the repository
2. Create a branch (`git checkout -b feature/my-change`)
3. Commit your changes
4. Open a pull request

Found a bug or have an idea? [Open an issue](../../issues).

## License

License to be decided. It will be added before the first stable release.

---