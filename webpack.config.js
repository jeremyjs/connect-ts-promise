const path = require('path');

const config = {
  entry: './lib/connect-ts-promise.spec.ts',
  target: 'node',
  node: {
    __dirname: false,
    __filename: false
  },
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'connect-ts-promise.spec.js'
  },
  resolve: {
    extensions: ['.ts', 'tsx', '.js']
  },
  module: {
    rules: [
      { test: /\.tsx?$/,
        use: 'light-ts-loader' }
    ]
  }
};

module.exports = config;
