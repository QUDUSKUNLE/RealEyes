FROM node:14-alpine

RUN npm install pm2 -g

RUN mkdir -p /usr/src

WORKDIR /usr/src

COPY package*.json ./

RUN npm i

COPY src src

COPY .env .env

EXPOSE 2020

CMD ["npm", "start"]
