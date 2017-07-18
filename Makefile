export PATH := $(PWD)/node_modules/.bin/:$(PATH)

ifeq ($(NODE_ENV), production)
    SASS_FLAGS += --output-style compressed
endif

all: build-web

static/css/%.css: styles/%.scss
	mkdir -p $(dir $@)
	node-sass $(SASS_FLAGS) $< >$@

static/js/app.js: build
bin/server.js: build

build:
	webpack --progress

test:
	NODE_ENV=test mocha --recursive --require .babel-mocha -u qunit src

lint:
	eslint src

build-web: static/js/app.js static/css/app.css

.PHONY: build test lint build-web
