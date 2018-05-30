FROM sitespeedio/node:ubuntu-18.04-nodejs8.11.1

RUN apt-get update && apt-get install libnss3-tools iproute2 sudo net-tools -y
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

VOLUME /browsertime

COPY package.* /usr/src/app/
RUN npm install --production
COPY . /usr/src/app

COPY start.sh /start.sh

ENTRYPOINT ["/start.sh"]
