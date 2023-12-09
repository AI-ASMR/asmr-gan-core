# AiMR's Model Training

#### Table of Contents
1. [What is this?](#introduction)
2. [Getting started.](#getting-started)
3. [Build from source.](#build-from-source)
4. [Repo's file structure.](#file-structure)
5. [Versioning and automation.](#versioning)

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
You can also use the binaries via docker like so:
```shell
# todo, docker container.
```
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
You can use the binaries directly from source without building executables:
```shell
npm start -- --help
```

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

Both the (npm) library and the (git) versioned binary share the same common version number. Versioning is automatically increased via CI/CD in the event of meaningful changes. Once there's a version change CI/CD automatically deploys updates for git releases and npm releases respectively.

CI/CD implementation can be found here:
- [version-bump.yml](https://github.com/AI-ASMR/asmr-gan-core/blob/main/.github/workflows/version-bump.yml) - called on meaningful changes.
- [publish-git-version.yml](https://github.com/AI-ASMR/asmr-gan-core/blob/main/.github/workflows/publish-git-version.yml) - called on (above) version bump.
- [publish-npm-package.yml](https://github.com/AI-ASMR/asmr-gan-core/blob/main/.github/workflows/publish-npm-package.yml) - called on (above) version bump.

The repository hosts a minimal, scripted, cross-platform, build tool used by all github actions, as well as users (via npm-scripts.)

For more details, [read the documented source](https://github.com/AI-ASMR/asmr-gan-core/blob/main/scripts.js).