FROM node:18-slim

RUN apt-get update || : && apt-get install -y

RUN apt-get install -y ca-certificates wget

WORKDIR /usr/src/app
COPY package*.json ./

COPY . ./
RUN npm install --only=production

CMD [ "node", "build/src/index.js" ]

