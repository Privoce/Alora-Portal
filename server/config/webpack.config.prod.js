const {merge} = require('webpack-merge');
const {resolve} = require('path');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const {HashedModuleIdsPlugin} = require('webpack');
const baseConfig = require('./webpack.config');
const {PROJECT_ROOT} = require('./env');

module.exports = merge(baseConfig, {
    mode: 'production',
    plugins: [
        new HashedModuleIdsPlugin({
            context: resolve(PROJECT_ROOT, 'src'),
            hashFunction: 'sha256',
            hashDigest: 'hex',
            hashDigestLength: 20
        }),
    ],
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                extractComments: false
            }),
            new OptimizeCSSAssetsPlugin()
        ],
    },
    performance: {
        hints: false
    },
});