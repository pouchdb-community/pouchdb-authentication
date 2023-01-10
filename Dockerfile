FROM node:10-alpine
WORKDIR /pouchdb-authentication/
RUN npm install
COPY . .
