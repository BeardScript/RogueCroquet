module.exports = {
  resolve: {
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      vm: require.resolve("vm-browserify"),
      buffer: require.resolve("buffer")
    }
  }
}
