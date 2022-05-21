FROM node:14 as base

WORKDIR /node-ts

COPY package*.json ./

RUN npm i -verbose
RUN npm install typescript -g 

COPY . .

FROM base as production
EXPOSE 8080

RUN npm run build