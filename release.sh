#!/bin/bash
set -e


# Super simple release script for sitespeed.io
# Lets use it it for now and make it better over time :)
# You need np for this to work
# npm install --global np
np $1

# Update the docs with latest release number
bin/index.js --version  > ../sitespeed.io/docs/_includes/version/throttle.txt