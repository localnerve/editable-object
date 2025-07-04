/**
 * webpack config to build the public module.
 * Devdeps in outer repo.
 *
 * Copyright (c) 2025 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import * as path from 'node:path';
import webpack from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import pkgJson from '../package.json' with { type: 'json' };
import { stageDir, distDir } from './build-settings.js';

export default {
  mode: 'production',
  entry: path.join(stageDir, 'editable-object.js'),
  optimization: {
    minimizer: [new TerserPlugin({ extractComments: false })],
  },
  experiments: {
    outputModule: true
  },
  output: {
    path: distDir,
    filename: 'editable-object.js',
    library: {
      type: 'module'
    }
  },
  module: {
    rules: [{
      test: /\.js$/,
      loader: 'babel-loader'
    }]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new webpack.BannerPlugin({
      banner: `editable-object@${pkgJson.version}, Copyright (c) ${(new Date()).getFullYear()} Alex Grant <alex@localnerve.com> (https://www.localnerve.com), LocalNerve LLC, BSD-3-Clause`,
      entryOnly: true
    })
  ]
};