const {resolve} = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WebpackBar = require('webpackbar');
const {argv} = require('yargs');
const {PROJECT_ROOT} = require('./env');

const isDev = argv.mode !== 'production';

const babelOptions = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    chrome: '80'
                }
            }
        ],
        '@babel/preset-react'
    ],
    plugins: [
        'react-hot-loader/babel'
    ]
};

module.exports = {
    entry: {
        portal: [resolve(PROJECT_ROOT, 'src/js/portal.js')],
        stash: [resolve(PROJECT_ROOT, 'src/js/stash.js')],
        background: [resolve(PROJECT_ROOT, 'src/js/background.js')]
    },
    output: {
        publicPath: '/',
        path: resolve(PROJECT_ROOT, 'build'),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: babelOptions
                    },
                    {
                        loader: 'eslint-loader'
                    }
                ],
                exclude: /node_modules/
            },
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: babelOptions
                    },
                    {
                        loader:'ts-loader'
                    },
                    {
                        loader: 'eslint-loader'
                    }
                ],
                exclude: /node_modules/
            },
            {
                test: /\.(png|jpg|gif|woff2?)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            name: '[name]_[contenthash].[ext]',
                            esModule: false
                        }
                    }
                ]
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            hmr: isDev
                        }
                    },
                    {
                        loader: 'css-loader'
                    }
                ]
            },
            {
                test: /\.s[ac]ss$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            hmr: isDev
                        }
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1
                        }
                    },
                    {
                        loader: 'sass-loader'
                    }
                ]
            },
            {
                test: /\.less$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            hmr: isDev
                        }
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1
                        }
                    },
                    {
                        loader: 'less-loader',
                        options: {
                            lessOptions: {
                                modifyVars: {
                                    'primary-color': '#a51d1d',
                                    'link-color': '#a51d1d',
                                },
                                javascriptEnabled: true
                            }
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin({
            cleanStaleWebpackAssets: false
        }),
        new WebpackBar({
            color: isDev ? '#fff300' : '#00fff7'
        }),
        new MiniCssExtractPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: resolve(PROJECT_ROOT, 'src/manifest.json'),
                    to: resolve(PROJECT_ROOT, 'build'),
                    transform(data) {
                        let content = JSON.parse(data);
                        if (isDev) {
                            content['content_security_policy'] =
                                (content['content_security_policy'] || '') +
                                'script-src \'self\' \'unsafe-eval\';object-src \'self\';';
                        }
                        return Buffer.from(JSON.stringify(content));
                    }
                }
            ]
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: resolve(PROJECT_ROOT, 'public'),
                    to: resolve(PROJECT_ROOT, 'build'),
                    flatten: true
                }
            ]
        }),
        new HtmlWebpackPlugin({
            template: resolve(PROJECT_ROOT, 'src/html/template.ejs'),
            templateParameters: {
                title: 'Alora Portal'
            },
            filename: 'portal.html',
            chunks: ['portal'],
            minify: {
                collapseWhitespace: true
            }
        }),
        new HtmlWebpackPlugin({
            template: resolve(PROJECT_ROOT, 'src/html/template.ejs'),
            templateParameters: {
                title: 'Alora Portal Stash'
            },
            filename: 'stash.html',
            chunks: ['stash'],
            minify: {
                collapseWhitespace: true
            }
        })
    ],
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        mainFiles: ['index'],
        alias: {
            'react-dom': '@hot-loader/react-dom'
        }
    }
};