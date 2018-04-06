module.exports = function(config) {
  config.set({
    files: [
      {'pattern': './test/setup.js', included: true},

      {'pattern': './src/**/*.js', included: false},
      {'pattern': './third-party/*.js', included: false},

      {'pattern': './test/**/*.test.js', included: false},
    ],
    exclude: [
      './src/**/*.run.js',
      './src/content/edit-user-script.js',  // CodeMirror dependency.
      './src/content/install-dialog.js',  // Not ready for testing yet.  TODO!
    ],
    frameworks: [
      'requirejs', // Generally alpha, but requirejs must be first.
      'chai', 'mocha', 'sinon', 'sinon-chrome'
      ],
    preprocessors: config.coverage
        ? {'src/**/*.js': ['coverage']}
        : {},

    // Proxy requests (made by RequireJS) to /base (where Karma serves them).
    proxies: {
      '/src': '/base/src',
      '/test': '/base/test',
      '/third-party': '/base/third-party',
    },

    reporters: process.env.KARMA_REPORTER
        ? [process.env.KARMA_REPORTER]
        : ['coverage', 'progress'],
    port: 7328,
    colors: true,
    logLevel: config.LOG_WARN,
    autoWatch: true,

    browsers: ['Firefox'],
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
