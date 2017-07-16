var UglifyEsPlugin = require('uglify-es-webpack-plugin');
var path = require("path");
var webpack = require("webpack");

var plugins = [
    new webpack.EnvironmentPlugin({
        NODE_ENV: "development",
        MAPS_API_KEY: null
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
];

if (process.env.NODE_ENV == "production") {
    plugins.push(new UglifyEsPlugin());
}

module.exports = {
    entry: "./src/client/index.js",
    target: "web",
    resolve: {
        extensions: [".js"],
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            loader: "babel-loader",
            options: {
                cacheDirectory: true,
                presets: [
                    ["env", {
                        targets: {
                            browsers: "firefox >= 54",
                        },
                        useBuiltins: true,
                        modules: false,
                    }],
                ],
                plugins: ["transform-object-rest-spread"],
            },
        }],
    },
    output: {
        path: path.resolve(__dirname, "static/js"),
        filename: "app.js",
    },
    plugins: plugins,
};
