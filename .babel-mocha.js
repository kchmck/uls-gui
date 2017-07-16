require("babel-register")({
    presets: [
        ["env", {
            targets: {node: "current"},
            useBuiltins: true,
        }],
    ],
    plugins: ["transform-object-rest-spread"],
});
