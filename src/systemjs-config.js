SystemJS.config({
  map: {
    'plugin-babel': '/third-party/systemjs-plugin-babel/plugin-babel.js',
    'systemjs-babel-build': '/third-party/systemjs-plugin-babel/systemjs-babel-browser.js'
  },
  transpiler: 'plugin-babel'
});
