const chalk = require('chalk');
const webpack = require('webpack');
const express = require('express');
const cors = require('cors');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const {default: SseStream} = require('ssestream');
const devConfig = require('../config/webpack.config.dev');
const {HOST, PORT, HMR_PATH, ARR_PATH, CONTENT_SCRIPT_CHUNKS} = require('../config/env');

(async () => {
  const compiler = webpack(devConfig);
  const devServer = express();
  devServer.use(cors());
  devServer.use(webpackDevMiddleware(compiler, {
    quiet: true,
    stats: false,
    noInfo: true,
    writeToDisk: true
  }));
  devServer.use(webpackHotMiddleware(compiler, {
    publicPath: devConfig.output.publicPath,
    log: false,
    path: HMR_PATH
  }));
  devServer.use(`${ARR_PATH}`, (req, res, next) => {
    const sseStream = new SseStream(req);
    sseStream.pipe(res);
    let closed = false;
    compiler.hooks.done.tap('crx-arr-plugin', stats => {
      if (!closed) {
        const needCrxArr =
          !stats.hasErrors() &&
          stats.toJson({all: false, modules: true}).modules.some(module =>
            module.chunks.some(chunk =>
              CONTENT_SCRIPT_CHUNKS.includes(chunk)
            )
          );
        if (needCrxArr) {
          sseStream.write(
            {
              event: 'compiled',
              data: {}
            },
            'utf-8',
            err => {
              if (err) {
                console.error(err);
              }
            }
          );
        }
      }
    });
    res.on('close', () => {
      closed = true;
      sseStream.unpipe(res);
    });
    next();
  });
  const httpServer = devServer.listen(PORT, HOST, err => {
    if (err) {
      console.error(err);
    }
  });
  ['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, () => {
      httpServer.close();
      console.log(`${chalk.bgRed.black(' QUIT ')} ${chalk.green.bold('Bye~')}`);
      process.exit();
    });
  });
})();
