const path = require("path");
const glob = require("glob");
const { merge } = require("webpack-merge");
const rogueConfig = require('./webpack.config.rogue');

const webpackFiles = glob.sync("./**/webpack.config.user.js");
const userConfigs = [];

webpackFiles.forEach(file => {
  userConfigs.push(require(path.resolve(file)));
});

const userConfig = userConfigs.length > 0 ? merge(...userConfigs) : {};

module.exports = merge(rogueConfig, userConfig);
