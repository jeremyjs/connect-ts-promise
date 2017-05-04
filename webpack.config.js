const path = require('path');

const config = {
  entry: './test/connect-ts-promise.ts',
  target: 'node',
  node: {
    __dirname: false,
    __filename: false
  },
  output: {
    path: path.resolve(__dirname, 'test'),
    filename: 'connect-ts-promise.js'
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
