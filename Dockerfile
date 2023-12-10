# node version from .npmrc and .nvmrc
FROM node:18.19.0

WORKDIR /container

COPY . .

RUN npm install

ENTRYPOINT [ "npm", "start", "--" ]