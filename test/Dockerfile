FROM sitespeedio/node:ubuntu-20.04-nodejs-12.18.2

RUN apt-get update && apt-get install libnss3-tools iproute2 sudo net-tools -y
RUN mkdir -p /usr/src/app

VOLUME /throttle

COPY package.json /usr/src/app/
COPY npm-shrinkwrap.json /usr/src/app/
RUN npm install --production
COPY . /usr/src/app

WORKDIR /usr/src/app

COPY test/start.sh /start.sh

ENTRYPOINT ["/start.sh"]
