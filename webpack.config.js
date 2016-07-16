var webpack = require("webpack");

var plugins = [
    new webpack.DefinePlugin({
        "process.env": JSON.stringify({
            NODE_ENV: process.env.NODE_ENV,
            MAPS_API_KEY: process.env.MAPS_API_KEY,
        }),
    }),
];

if (process.env.NODE_ENV == "production") {
    plugins.push(new webpack.optimize.UglifyJsPlugin({compress: true}));
}

module.exports = {
    entry: "./lib/client/index",
    resolve: {
        extensions: ["", ".js"],
    },
    output: {
        path: __dirname + "/static/js",
        filename: "app.js",
    },
    plugins: plugins,
}
