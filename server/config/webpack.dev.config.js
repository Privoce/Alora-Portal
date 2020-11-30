const {HotModuleReplacementPlugin} = require('webpack');
const {merge} = require('webpack-merge');
const {resolve} = require('path');
const baseConfig = require('./webpack.config');
const {HOST, PORT, HMR_PATH, CONTENT_SCRIPT_CHUNKS, BACKGROUND_CHUNK, PROJECT_ROOT} = require('./env');

const hmrUrl = encodeURIComponent(`http://${HOST}:${PORT}${HMR_PATH}`);
const hmrClient = `webpack-hot-middleware/client?path=${hmrUrl}&reload=true&overlay=true`;
const reactHotLoader = 'react-hot-loader/patch';
const arrContentScriptClient = resolve(__dirname, '../util/arrContentScriptClient.js');
const arrBackgroundClient = resolve(__dirname, '../util/arrBackgroundClient.js');

let patchedEntry = {};
for (let entryName in baseConfig.entry) {
    if (CONTENT_SCRIPT_CHUNKS.includes(entryName)) {
        patchedEntry[entryName] = [arrContentScriptClient];
    } else if (BACKGROUND_CHUNK === entryName) {
        patchedEntry[entryName] = [hmrClient, arrBackgroundClient];
    } else {
        patchedEntry[entryName] = [hmrClient, reactHotLoader];
    }
}

module.exports = merge(baseConfig, {
    mode: 'development',
    entry: patchedEntry,
    devtool: 'eval-cheap-module-source-map',
    plugins: [
        new HotModuleReplacementPlugin()
    ]
});