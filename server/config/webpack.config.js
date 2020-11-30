const {resolve} = require("path");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const WebpackBar = require("webpackbar");
const FriendlyErrorsPlugin = require("friendly-errors-webpack-plugin");
const {argv} = require("yargs");
const {PROJECT_ROOT, MINIMUM_CHROME_VERSION} = require("./env");
const isDev = argv.mode !== "production";

module.exports = {
    entry: {
        portal: [resolve(PROJECT_ROOT, "src/js/portal.jsx")],
        stash: [resolve(PROJECT_ROOT, "src/js/stash.jsx")],
        background: [resolve(PROJECT_ROOT, "src/js/background.js")],
    },
    output: {
        publicPath: "/",
        path: resolve(PROJECT_ROOT, "build"),
        filename: "[name].bundle.js",
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            [
                                '@babel/preset-env',
                                {
                                    targets: {
                                        chrome: MINIMUM_CHROME_VERSION
                                    }
                                }
                            ],
                            '@babel/preset-react',
                            '@babel/preset-typescript',
                        ],
                        plugins: [
                            'react-hot-loader/babel',
                            'babel-plugin-lodash',
                            ['@babel/plugin-proposal-decorators', {legacy: true}],
                            ['@babel/plugin-proposal-class-properties', {loose: true}],
                            ['babel-plugin-import', {libraryName: 'antd'}],
                        ],
                    },
                },
                exclude: /node_modules/
            },
            {
                test: /\.tsx?$/,
                use: ['awesome-typescript-loader'],
                exclude: /node_modules/
            },
            {
                test: /\.(png|jpg|gif|woff2?)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            name: '[name].[ext]',
                            esModule: false,
                            limit: 0
                        }
                    }
                ]
            },
            {
                test: /\.css$/,
                use: [
                    isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
                    'css-loader'
                ]
            },
            {
                test: /\.s[ac]ss$/,
                use: [
                    isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1
                        }
                    },
                    'sass-loader'
                ]
            },
            {
                test: /\.less$/,
                use: [
                    isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
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
                                javascriptEnabled: true
                            }
                        }
                    }
                ]
            }
        ],
    },
    plugins: [
        new CleanWebpackPlugin({
            cleanStaleWebpackAssets: false,
        }),
        new WebpackBar({
            color: isDev ? "#fff300" : "#00fff7",
        }),
        new FriendlyErrorsPlugin(),
        new MiniCssExtractPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: resolve(PROJECT_ROOT, "src/manifest.json"),
                    to: resolve(PROJECT_ROOT, "build"),
                    transform(data) {
                        let content = JSON.parse(data);
                        if (isDev) {
                            content["content_security_policy"] =
                                (content["content_security_policy"] || "") +
                                "default-src *; style-src 'self' http://* 'unsafe-inline'; script-src 'self' http://* 'unsafe-inline' 'unsafe-eval';";
                        }
                        content.name = content.name || process.env.npm_package_name;
                        content.description =
                            content.description || process.env.npm_package_description;
                        content.version =
                            content.version || process.env.npm_package_version;
                        content.minimum_chrome_version = MINIMUM_CHROME_VERSION;
                        return Buffer.from(JSON.stringify(content));
                    },
                },
            ],
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: resolve(PROJECT_ROOT, "public"),
                    to: resolve(PROJECT_ROOT, "build"),
                    flatten: true,
                },
            ],
        }),
        new HtmlWebpackPlugin({
            template: resolve(PROJECT_ROOT, "src/html/template.ejs"),
            templateParameters: {
                title: "Alora Portal",
            },
            filename: "portal.html",
            chunks: ["portal"],
            minify: {
                collapseWhitespace: true,
            },
        }),
        new HtmlWebpackPlugin({
            template: resolve(PROJECT_ROOT, "src/html/template.ejs"),
            templateParameters: {
                title: "Alora Portal Stash",
            },
            filename: "stash.html",
            chunks: ["stash"],
            minify: {
                collapseWhitespace: true,
            },
        }),
    ],
    resolve: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
        alias: {
            "react-dom": "@hot-loader/react-dom",
        },
    },
};
