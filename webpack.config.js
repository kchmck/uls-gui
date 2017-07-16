var UglifyEsPlugin = require('uglify-es-webpack-plugin');
var path = require("path");
var webpack = require("webpack");

var plugins = [
    new webpack.EnvironmentPlugin({
        NODE_ENV: "development",
        MAPS_API_KEY: null
    }),
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
    output: {
        path: path.resolve(__dirname, "static/js"),
        filename: "app.js",
    },
    plugins: plugins,
};
