# Simulate slow network connections on Linux and Mac OS X

![Linux](https://github.com/sitespeedio/throttle/workflows/Linux/badge.svg)
![OSX](https://github.com/sitespeedio/throttle/workflows/OSX/badge.svg)
![Docker](https://github.com/sitespeedio/throttle/workflows/Run%20Docker/badge.svg)

Inspired by [tylertreat/Comcast](https://github.com/tylertreat/Comcast), the [connectivity setting in the WPTAgent](https://github.com/WPO-Foundation/wptagent/blob/master/internal/traffic_shaping.py) and [sltc](https://github.com/sitespeedio/sltc).

Throttle uses *pfctl* on Mac and *tc* on Linux to simulate different network speeds. On Linux you also need *ip* and *route* for Throttle to work.

You can set the download/upload speed and RTT. Upload/download is in kbit/s and RTT in ms.

This is an early release, so please help us find potential bugs.

Use with [latest NodeJS LTS](https://nodejs.org/en/).

## Install

```
npm install @sitespeed.io/throttle -g
```

On OSX, add these lines to ```/etc/pf.conf``` if they don't exist, to prevent the ```pfctl: Syntax error in config file: pf rules not loaded``` error when you try to run throttle

```
pf_enable="YES"
pflog_enable="YES"
```

## Start simulate a slower network connection

Here is an example for running with 3G connectivity. Remember: Throttle will use sudo so your user will need
sudo rights.

```
throttle --up 330 --down 780 --rtt 200
```

## Pre made profiles
To make it easier we have pre made profiles, check them out by *throttle --help*:

```
--profile         Premade profiles, set to one of the following
                     3g: up:768 down:1600 rtt:150
                     3gfast: up:768 down:1600 rtt:75
                     3gslow: up:400 down:400 rtt:200
                     2g: up:256 down:280 rtt:400
                     cable: up:1000 down:5000 rtt:14
                     dsl: up:384 down:1500 rtt:14
                     3gem: up:400 down:400 rtt:200
                     4g: up:9000 down:9000 rtt:85
                     lte: up:12000 down:12000 rtt:35
                     edge: up:200 down:240 rtt:35
                     dial: up:30 down:49 rtt:60
                     fois: up:5000 down:20000 rtt:2
```

You can start throttle with one of the premade profiles:

```
throttle --profile 3gslow
```

or even simpler
```
throttle 3gslow
```

## Stop simulate the network
Stopping is as easy as giving the parameter *stop* to throttle.

```
throttle --stop
```

or

```
throttle stop
```

## Add delay on your localhost (Linux only at the moment)
This is useful if you run [WebPageReplay](https://github.com/catapult-project/catapult/blob/master/web_page_replay_go/README.md) and want to add som latency to your tests.

```
throttle --rtt 200 --localhost
```

## Stop adding delay on localhost (Linux only)

```
throttle --stop --localhost
```

## Use directly in NodeJS


```javascript
const throttle = require('@sitespeed.io/throttle');
// Returns a promise
throttle.start({up: 360, down: 780, rtt: 200}).then(() => ...
```

or 

```javascript
const throttle = require('@sitespeed.io/throttle');
// Returns a promise
const options = {up: 360, down: 780, rtt: 200};
await throttle.start(options);
// Do your thing and then stop
await throttle.stop();

```

## Log all commands
You can log all the commands that sets up the throttling by setting `LOG_THROTTLE=true`.

```
LOG_THROTTLE=true throttle 3gslow
```

## Run in Docker (on Linux)

Make sure to run ```sudo modprobe ifb numifbs=1``` before you start the container.

And then when you actually start your Docker container, give it the right privileges with ```--cap-add=NET_ADMIN```