# Simulate slow network connections on Linux and Mac OS X
Inspired by [tylertreat/Comcast](https://github.com/tylertreat/Comcast), the [connectivity setting in the WPTAgent](https://github.com/WPO-Foundation/wptagent/blob/master/internal/traffic_shaping.py) and [sltc](https://github.com/sitespeedio/sltc).

Throttle uses *pfctl* on Mac and *tc* on Linux to simulate different network speeds. On Linux you also need *ip* and *route* for Throttle to work.

You can set the download/upload speed and RTT. Upload/download is in kbit/s and RTT in ms.

This is an early release, so please help us find potential bugs.

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
                     2g: up:32 down:35 rtt:650
                     cable: up:1000 down:5000 rtt:14
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

## Run in Docker (on Linux)

Make sure to run ```sudo modprobe ifb numifbs=1``` before you start the container.

And then when you actually start your Docker container, give it the right privileges with ```--cap-add=NET_ADMIN```
