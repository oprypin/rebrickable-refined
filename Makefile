ts_files = $(wildcard src/*.ts src/*/*.ts)
ts_dist := $(ts_files:.ts=.js)
ts_dist := $(ts_dist:src/%=dist/%)

copied_files = $(wildcard src/*.html src/*/*.html data/manifest.json)
copied_dist := $(copied_files:src/%=dist/%)
copied_dist := $(copied_dist:data/%=dist/%)

icons_dist = dist/icon16.png dist/icon32.png dist/icon48.png dist/icon128.png

.PHONY: all
all: $(ts_dist) $(icons_dist) dist/parts-images.json $(copied_dist)

$(ts_dist) &: $(ts_files) tsconfig.json node_modules/.bin/tsc
	node_modules/.bin/tsc

dist/%.html: src/%.html
	cp $< $@

dist/%.json: data/%.json
	cp $< $@

$(icons_dist) &: data/logo.svg
	inkscape --export-width=16 --export-filename=dist/icon16.png data/logo.svg
	inkscape --export-width=32 --export-filename=dist/icon32.png data/logo.svg
	inkscape --export-width=48 --export-filename=dist/icon48.png data/logo.svg
	inkscape --export-width=128 --export-filename=dist/icon128.png data/logo.svg

dist/parts-images.json: scripts/populate_data.py src/related-parts-data.ts
	python3 scripts/populate_data.py

node_modules/.bin/tsc node_modules/.bin/eslint &: package-lock.json
	npm ci --silent
