const {resolve} = require('path');
const webpack = require('webpack');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    entry: {
        portal: resolve(__dirname, 'src', 'js', 'portal.js'),
        stash: resolve(__dirname, 'src', 'js', 'stash.js'),
        background: resolve(__dirname, 'src', 'js', 'background.js')
    },
    output: {
        path: resolve(__dirname, 'build'),
        filename: '[name].bundle.js'
    },
    devtool: 'cheap-module-source-map',
    devServer: {
        contentBase: resolve(__dirname, 'build'),
        hot: true,
        port: 8080,
        disableHostCheck: true,
        writeToDisk: true
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                '@babel/preset-env',
                                '@babel/preset-react'
                            ]
                        }
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
                ],
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            hmr: process.env.NODE_ENV !== 'production'
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
                            hmr: process.env.NODE_ENV !== 'production'
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
                            hmr: process.env.NODE_ENV !== 'production'
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
    resolve: {
        alias: {
            'react-dom': '@hot-loader/react-dom'
        }
    },
    plugins: [
        new webpack.ProgressPlugin(),
        new CleanWebpackPlugin({
            cleanStaleWebpackAssets: false
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: resolve(__dirname, 'src', 'manifest.json'),
                    to: resolve(__dirname, 'build'),
                    transform(content) {
                        return Buffer.from(JSON.stringify(JSON.parse(content)));
                    }
                }
            ]
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: resolve(__dirname, 'public'),
                    to: resolve(__dirname, 'build'),
                    flatten: true
                }
            ]
        }),
        new HtmlWebpackPlugin({
            template: resolve(__dirname, 'src', 'html', 'template.ejs'),
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
            template: resolve(__dirname, 'src', 'html', 'template.ejs'),
            templateParameters: {
                title: 'Alora Portal Stash'
            },
            filename: 'stash.html',
            chunks: ['stash'],
            minify: {
                collapseWhitespace: true
            }
        }),
        new MiniCssExtractPlugin()
    ],
    optimization: {
        minimize: process.env.NODE_ENV === 'production',
        minimizer: [
            new TerserPlugin(),
            new CssMinimizerPlugin()
        ]
    }
};