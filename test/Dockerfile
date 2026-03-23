FROM sitespeedio/node:ubuntu-20.04-nodejs-16.5.0

RUN apt-get update && apt-get install libnss3-tools iproute2 sudo net-tools -y
RUN mkdir -p /usr/src/app

VOLUME /throttle
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/
RUN npm install --production
COPY . /usr/src/app

COPY test/start.sh /start.sh

ENTRYPOINT ["/start.sh"]
