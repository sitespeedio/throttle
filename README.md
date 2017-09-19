# Simulate network connections Linux and Mac OS X
Inspired by [tylertreat/Comcast](https://github.com/tylertreat/Comcast), the [connectivity setting in the WPTAgent](https://github.com/WPO-Foundation/wptagent/blob/master/internal/traffic_shaping.py) and [sltc](https://github.com/sitespeedio/sltc).

This is a really early release, help us test it and make sure it works as expected :)

You can set the download/upload speed and RTT. Upload/download is in kbit/s and RTT in ms.

## Start simulate a 3g network connection

**throttle --up 330 --down 780 --rtt 200**

## Stop simulate the 3g network connection
**throttle --stop**

## Add delay on your localhost (Linux only at the moment)

**throttle --rtt 200 --localhost**

## Stop adding delay on localhost
**throttle --stop --localhost**

## Use directly in NodeJS
WIP.

## Run in Docker (on Linux)

Make sure to run: **sudo modprobe ifb numifbs=1** before you start the container.

And then when you start your Docker container: *--cap-add=NET_ADMIN*
