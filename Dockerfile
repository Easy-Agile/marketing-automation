FROM node:16
WORKDIR /usr/src/app
COPY package*.json ./
COPY src ./src
RUN npm install --only=production
ENV NODE_ENV=production
CMD [ "node", "src/bin/main.js", "--downloader=live", "--uploader=live" ]
