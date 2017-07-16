var UglifyEsPlugin = require('uglify-es-webpack-plugin');
var nodeExternals = require('webpack-node-externals');
var path = require("path");
var webpack = require("webpack");

function createPlugins(plugins) {
    plugins.push(new webpack.optimize.ModuleConcatenationPlugin());

    if (process.env.NODE_ENV === "production") {
        plugins.push(new UglifyEsPlugin());
    }

    return plugins;
}

function createRules(targets) {
    return [{
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        options: {
            cacheDirectory: true,
            presets: [
                ["env", {
                    targets,
                    useBuiltins: true,
                    modules: false,
                }],
            ],
            plugins: ["transform-object-rest-spread"],
        },
    }];
}

function createConf(entry, target, externals, output, rules, plugins) {
    return {
        entry,
        target,
        externals,
        resolve: {
            extensions: [".js"],
        },
        module: {
            rules,
        },
        plugins,
        output,
    };
}

function createBrowserConf() {
    return createConf("./src/client/index.js", "web", {}, {
        path: path.resolve(__dirname, "static/js"),
        filename: "app.js",
    }, createRules({
        browsers: "firefox >= 54",
    }), createPlugins([
        new webpack.EnvironmentPlugin({
            NODE_ENV: "development",
            MAPS_API_KEY: null
        }),
    ]));
}

function createServerConf() {
    return createConf("./src/server/index.js", "node", nodeExternals(), {
        path: path.resolve(__dirname, "bin"),
        filename: "server.js",
    }, createRules({
        node: "current",
    }), createPlugins([]));
}

module.exports = [
    createBrowserConf(),
    createServerConf(),
];
