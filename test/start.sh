#!/bin/bash
set -e

## Start/stop a couple of times
/usr/src/app/bin/index.js --profile 3gslow
/usr/src/app/bin/index.js --stop
/usr/src/app/bin/index.js --profile cable
/usr/src/app/bin/index.js --stop