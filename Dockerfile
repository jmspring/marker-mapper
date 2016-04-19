FROM mhart/alpine-node:5.10.1

WORKDIR /app
ADD app.js channel.js package.json ./
ADD bin ./bin
ADD public ./public
ADD routes ./routes
ADD tests ./tests
ADD views ./views
ADD config ./config

RUN apk add --no-cache make gcc g++ python bash
RUN npm install

EXPOSE 3000
CMD ["npm", "start"]