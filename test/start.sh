#!/bin/bash
set -e

## Start/stop a couple of times
bin/index.js --profile 3gslow
bin/index.js --stop
bin/index.js --profile cable
bin/index.js --stop