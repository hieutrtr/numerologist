module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          unstable_transformImportMeta: true,
        },
      ],
    ],
    plugins: [],
    // Ignore problematic packages that use import.meta in ways incompatible with Hermes
    ignore: [
      'node_modules/@react-native/debugger-frontend',
      'node_modules/sucrase',
      'node_modules/@react-native/inspector',
    ],
  };
};
