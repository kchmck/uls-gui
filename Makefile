export PATH := $(PWD)/node_modules/.bin/:$(PATH)

SRC := $(shell find src -name "*.js")
LIB := $(SRC:src/%=lib/%)

ifeq ($(NODE_ENV), production)
    SASS_FLAGS += --output-style compressed
endif

lib/%.js: src/%.js
	mkdir -p $(dir $@)
	babel $< -o $@

static/css/%.css: styles/%.scss
	mkdir -p $(dir $@)
	node-sass $(SASS_FLAGS) $< >$@

static/js/app.js: $(LIB)
	webpack --cache

build: $(LIB)

test: build
	mocha --compilers js:babel-register -u qunit lib/**/test/*

lint:
	eslint src

build-web: static/js/app.js static/css/app.css

serve: lib/server/index.js
	nodemon -w views -w static -e hbs,js $<

.PHONY: build test lint build-web serve
