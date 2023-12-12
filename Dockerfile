# CUDA base image
FROM nvidia/cuda:11.6.1-cudnn8-devel-ubuntu20.04 as cuda-base

# install curl
ENV DEBIAN_FRONTEND=noninteractive
RUN apt update && apt install -y curl && rm -rf /var/lib/apt/lists/*
RUN curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash 

# node version from .npmrc and .nvmrc
SHELL ["/bin/bash", "--login", "-i", "-c"]
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.2/install.sh | bash
RUN source /root/.bashrc && nvm install v18.19.0

# Set PATH to include Node.js binaries installed via nvm
ENV PATH="/root/.nvm/versions/node/v18.19.0/bin:${PATH}"

# link cuda related libs to lib64 so tensorflow
# can find all of them.
RUN ln -s /usr/lib/x86_64-linux-gnu/libcud* /lib64
RUN ln -s /usr/local/cuda/lib64/* /lib64
RUN ln -s /usr/local/cuda-11.6/compat/* /lib64

WORKDIR /container

COPY . .

RUN npm install

ENTRYPOINT [ "npm", "start", "--" ]