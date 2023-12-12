# AiMR's Model Training

![Npm publish passing](https://github.com/AI-ASMR/asmr-gan-core/actions/workflows/publish-npm-package.yml/badge.svg?branch=main)
![Git publish passing](https://github.com/AI-ASMR/asmr-gan-core/actions/workflows/publish-git-version.yml/badge.svg?branch=main)
![Docker publish passing](https://github.com/AI-ASMR/asmr-gan-core/actions/workflows/publish-docker-tag.yml/badge.svg?branch=main)
[![Npm package version](https://img.shields.io/npm/v/%40aimr%2Fasmr-gan-lib)](https://www.npmjs.com/package/@aimr/asmr-gan-lib)
[![GitHub release](https://img.shields.io/github/v/release/AI-ASMR/asmr-gan-core)](https://github.com/AI-ASMR/asmr-gan-core/releases)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/0e89310a47e24d6bb14b42183a653171)](https://app.codacy.com/gh/AI-ASMR/asmr-gan-core/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Docker](https://badgen.net/badge/icon/docker?icon=docker&label)](https://hub.docker.com/repository/docker/stiliyankushev/aimr-asmr-gan/general)
 
#### Table of Contents
1. [What is this?](#introduction)
2. [Getting started.](#getting-started)
3. [Build from source.](#build-from-source)
4. [Repo's file structure.](#file-structure)
5. [Versioning and automation.](#versioning)
6. [Arch linux NVIDIA Container Toolkit.](#arch-nvidia-container)

### What is this? <a id="introduction"></a>

This is an all-in-one repository that holds the source code for both the training of the AI GAN model, along with the library that can be used in any javascript context to load a pre-trained model and use it interactively.

### Getting started. <a id="getting-started"></a>

The library can be found at [npm](https://www.npmjs.com/package/@aimr/asmr-gan-lib) and at the [latest release](https://github.com/AI-ASMR/asmr-gan-core/releases/).
You can get it via npm like so.
```shell
npm i @aimr/asmr-gan-lib
```
Or you can install it locally by downloading the latest release.
```shell
npm i aimr-asmr-gan-lib-<version>.tgz
```
To train your own model take a look at the [release binaries](https://github.com/AI-ASMR/asmr-gan-core/releases/).
To get a quick rundown on how to use it simply run:
```shell
asmr-gan-bin-<platform> --help
```
For better performance you can also use the binaries via docker like so:
```shell
# pull the latest version
sudo docker pull stiliyankushev/aimr-asmr-gan:latest
# run the docker instance (pass arguments at the end)
sudo docker run --gpus all -ti stiliyankushev/aimr-asmr-gan:latest --help
```

#### (Optional) Docker Prerequisites.
Running the above docker container will automatically use a version of tensorflow that makes use of native C bindings. It'll also try to take advantage of any CUDA enabled GPUs running on the system. The docker container already pre-configures Cuda and Cudnn to work with tensorflow js. What you need to do is have:
-   Nvidia GPU with Cuda support.
-   Running a Linux distro.
-   Nvidia proprietary drivers installed.
-   Installed and configured NVIDIA Container Toolkit. (for arch linux, [follow my guide](#arch-nvidia-container).)

### Build from source. <a id="build-from-source"></a>

You can build both the library and the binary from source using short predefined npm-scripts.
You need to install deps first.
```shell
git clone https://github.com/AI-ASMR/asmr-gan-core.git
cd ./asmr-gan-core
npm i
```
Build the library:
```shell
npm run build.lib
```
Build the binaries:
```shell
npm run build.bin
```
You can use the binaries directly from source without building executables.
This will attempt to use your (CUDA enabled) GPU (Linux Only),
same as with the docker container:
```shell
npm start -- --help
```
#### Requirements for CUDA enabled model training.
Running the above command will work but might not automatically pick up your GPU. 
That's why it's advised to use the docker image which comes pre-configured. However, if you'd like to run this locally without docker, here's what you need:
-   Nvidia GPU with Cuda support.
-   Running a Linux distro (preferably supported by tensorflow).
-   Cuda installed (version < v12.0.0).
-   Nvidia linux driver that supports the version of cuda installed.
-   libcudnn installed (version >= 8.9.5).

### File structure. <a id="file-structure"></a>

This is a basic mono-repo that implements both a library and a running process. Both are their own separate typescript npm projects. Both share [common](https://github.com/AI-ASMR/asmr-gan-core/tree/main/common) assets/files, both share common npm packages listed in the root [package.json](https://github.com/AI-ASMR/asmr-gan-core/blob/main/package.json) and both extend root config files such as [tsconfig.json](https://github.com/AI-ASMR/asmr-gan-core/blob/main/tsconfig.json).

```
+-- 📁 bin         # git release files here.
+-- 📁 common      # shared files between lib and src.
+-- 📁 lib         # sources of library here.
+-- 📁 src         # sources of binary here.
+-- 📁 tensorboard # tfjs storage used by bin.
+-- 📁 tests       # unit tests here.
+-- scripts.js     # mini build tool used by the repo.
+-- version.cfg    # version tracker.
+-- package.json
+-- README.md
+-- tsconfig.json
```

### Versioning and automation. <a id="versioning"></a>

Both the (npm) library and the (git) versioned binary, as well as the docker container share the same common version number. Versioning is automatically increased via CI/CD in the event of meaningful changes. Once there's a version change CI/CD automatically deploys updates for git releases, npm releases and docker tag releases respectively.

CI/CD implementation can be found here:
-   [version-bump.yml](https://github.com/AI-ASMR/asmr-gan-core/blob/main/.github/workflows/version-bump.yml) - called on meaningful changes.
-   [publish-git-version.yml](https://github.com/AI-ASMR/asmr-gan-core/blob/main/.github/workflows/publish-git-version.yml) - called on (above) version bump.
-   [publish-npm-package.yml](https://github.com/AI-ASMR/asmr-gan-core/blob/main/.github/workflows/publish-npm-package.yml) - called on (above) version bump.
-   [publish-docker-tag.yml](https://github.com/AI-ASMR/asmr-gan-core/blob/main/.github/workflows/publish-docker-tag.yml) - called on (above) version bump.

The repository hosts a minimal, scripted and cross-platform build tool used by all github actions, as well as users (via npm-scripts.)

For more details, [read the documented source](https://github.com/AI-ASMR/asmr-gan-core/blob/main/scripts.js).

### Arch linux NVIDIA Container Toolkit. <a id="arch-nvidia-container"></a>

This is a short guide on how to install the NVIDIA Container Toolkit on arch linux. For other Linux distros take a look at their official [guide](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html).

I've created a custom PKGBUILD you need to build and install.

Make a fresh directory:
```shell
mkdir ./temp-nvidia 
cd ./temp-nvidia
```
Download the PKGBUILD file:
```shell
wget https://raw.githubusercontent.com/AI-ASMR/asmr-gan-core/main/PKGBUILD
```
Build the package:
```shell
makepkg
```
Install all .tar.zst files:
```shell
sudo pacman -U \ 
./libnvidia-container1-1.14.3-1-x86_64.pkg.tar.zst \
./libnvidia-container-tools-1.14.3-1-x86_64.pkg.tar.zst \
./nvidia-container-runtime-1.14.3-1-x86_64.pkg.tar.zst \
./nvidia-container-toolkit-1.14.3-1-x86_64.pkg.tar.zst \ 
./nvidia-container-toolkit-base-1.14.3-1-x86_64.pkg.tar.zst \ 
./nvidia-docker2-1.14.3-1-x86_64.pkg.tar.zst
```
Install `libnvidia-container-tools` manually:
```shell
sudo pacman -Syu libnvidia-container-tools
```
Configure docker:
```shell
sudo nvidia-ctk runtime configure --runtime=docker
```
Restart docker afterwards:
```shell
sudo systemctl restart docker
```
At this point docker should be configured. Test like so:
```shell
sudo docker run --gpus all ubuntu nvidia-smi
```
If `nvidia-smi` works, than everything works as expected.
