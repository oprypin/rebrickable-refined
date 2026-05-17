#!/bin/bash

set -e

# Check that the settings are in sync with the settings screen
diff --color -U3 \
    <(grep -oP "(?<=')[a-z\-]+(?=': (true|fals))" src/settings.ts) --label src/settings.ts \
    <(grep -oP '(?<=" id=").+?(?=")' src/popup.html) --label src/popup.html

# Check that the documentation and the settings screen are in sync
diff --color -U3 \
  <(grep -oP '(?<=" id=").+?(?=")|(?<=\> ).+?(?=</label>)|(?<=<h3>).+?(?=</h3>|$)' src/popup.html) --label src/popup.html \
  <(grep -oP '(?<=\[#).+(?=\])|(?<=^=== ).+|(?<=^== ).+' README.adoc | grep -Ev 'Browser extension that|SetMaster') --label README.adoc
