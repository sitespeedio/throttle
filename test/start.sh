#!/bin/bash
set -e

## Start/stop a couple of times
bin/index.js --profile 3gslow
bin/index.js --stop
bin/index.js --profile cable
bin/index.js --stop

## The ingress slot can already be taken by another tool, for example the
## eBPF monitoring agent on hardened GitHub Actions runners (clsact).
## Throttle should attach its filters to the existing qdisc and leave the
## qdisc alone on stop.
INTERFACE=$(ip route | awk '/default/ {print $5; exit}')
tc qdisc add dev "$INTERFACE" clsact
bin/index.js --profile cable
tc filter show dev "$INTERFACE" ingress | grep -q mirred
bin/index.js --stop
tc qdisc show dev "$INTERFACE" | grep -q clsact
if tc filter show dev "$INTERFACE" ingress | grep -q mirred; then
  echo "throttle filters were not cleaned up" >&2
  exit 1
fi
tc qdisc del dev "$INTERFACE" clsact

## Same thing when a plain ingress qdisc already exists
tc qdisc add dev "$INTERFACE" ingress
bin/index.js --profile cable
bin/index.js --stop