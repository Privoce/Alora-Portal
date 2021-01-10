const {HotModuleReplacementPlugin} = require("webpack");
const {merge} = require("webpack-merge");
const {resolve} = require("path");
const baseConfig = require("./webpack.config");
const {HOST, PORT, HMR_PATH, CONTENT_SCRIPT_CHUNKS, BACKGROUND_CHUNK} = require("./env");

const hmrUrl = encodeURIComponent(`http://${HOST}:${PORT}${HMR_PATH}`);
const hmrClient = `webpack-hot-middleware/client?path=${hmrUrl}&reload=true&overlay=true`;
const reactHotLoader = "react-hot-loader/patch";
const arrContentScriptClient = resolve(__dirname, "../util/arrContentScriptClient.js");
const arrBackgroundClient = resolve(__dirname, "../util/arrBackgroundClient.js");

for (let entryName in baseConfig.entry) {
    if (CONTENT_SCRIPT_CHUNKS.includes(entryName)) {
        baseConfig.entry[entryName].unshift(arrContentScriptClient);
    } else if (BACKGROUND_CHUNK === entryName) {
        baseConfig.entry[entryName].unshift(hmrClient);
        baseConfig.entry[entryName].unshift(arrBackgroundClient);
    } else {
        baseConfig.entry[entryName].unshift(reactHotLoader);
        baseConfig.entry[entryName].unshift(hmrClient);
    }
}

module.exports = merge(baseConfig, {
    mode: "development",
    devtool: "eval-cheap-module-source-map",
    stats: "none",
    plugins: [
        new HotModuleReplacementPlugin(),
    ],
});