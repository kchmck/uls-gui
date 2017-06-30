var path = require("path");
var webpack = require("webpack");

var plugins = [
    new webpack.EnvironmentPlugin({
        NODE_ENV: "development",
        MAPS_API_KEY: null
    }),
];

if (process.env.NODE_ENV == "production") {
    plugins.push(new webpack.optimize.UglifyJsPlugin({compress: true}));
}

module.exports = {
    entry: "./lib/client/index",
    resolve: {
        extensions: [".js"],
    },
    output: {
        path: path.resolve(__dirname, "static/js"),
        filename: "app.js",
    },
    plugins: plugins,
};
