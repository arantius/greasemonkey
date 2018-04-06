module.exports = function(config) {
  config.set({
    files: [
      './test/setup.js',
      './third-party/requirejs/require.js',
//      './src/**/*.js',
      './test/**/*.test.js',
    ],
    exclude: [
      './src/i18n.js',  // Use test set up version instead.
      './src/**/*.run.js',
      './src/content/edit-user-script.js',  // CodeMirror dependency.
      './src/content/install-dialog.js',  // Not ready for testing yet.  TODO!
      './src/util/rivets-formatters.js',
    ],
    frameworks: [
      'requirejs', // Generally alpha, but requirejs must be first.
      'chai', 'mocha', 'sinon', 'sinon-chrome'],
    preprocessors: config.coverage
        ? {'src/**/*.js': ['coverage']}
        : {},
    reporters: process.env.KARMA_REPORTER
        ? [process.env.KARMA_REPORTER]
        : ['coverage', 'progress'],
    port: 7328,
    colors: true,
    logLevel: config.LOG_WARN,
    autoWatch: true,

    browsers: ['FirefoxHeadless'],
    // https://github.com/karma-runner/karma-firefox-launcher/issues/76
    customLaunchers: {
      FirefoxHeadless: {
        base: 'Firefox',
        flags: [ '-headless' ],
      },
    },

    singleRun: true,
    concurrency: Infinity
  })
}
