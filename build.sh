#!/bin/bash

set -e -x

rm -rf dist
mkdir dist

make -j

jq 'del(.background.service_worker)' data/manifest.json > dist/manifest.json
(cd dist && zip -q -r ../rebrickable-refined.zip .)
mv rebrickable-refined.{zip,xpi}

jq 'del(.background.scripts, .browser_specific_settings)' data/manifest.json > dist/manifest.json
(cd dist && zip -q -r ../rebrickable-refined.zip .)
mv rebrickable-refined.{zip,crx}

rm dist/manifest.json
make
