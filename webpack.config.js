var webpack = require("webpack");

var plugins = [
    new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
        "process.env.MAPS_API_KEY": JSON.stringify(process.env.MAPS_API_KEY),
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
