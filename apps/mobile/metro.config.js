const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude debugger frontend and sucrase from bundling
// These packages use import.meta in ways that break with Hermes
const exclusionList = [
  /node_modules\/@react-native\/debugger-frontend\/.*/,
  /node_modules\/sucrase\/.*/,
  /node_modules\/@react-native\/inspector\/.*/,
];

config.resolver = {
  ...config.resolver,
  blockList: (config.resolver.blockList || []).concat(exclusionList),
  // Skip resolving main fields for these packages
  disableHierarchicalLookup: false,
};

// Configure transformer options to handle ES modules properly
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: true,
      inlineRequires: true,
    },
  }),
};

module.exports = config;
