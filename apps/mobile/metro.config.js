const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Force Metro to resolve symlinked packages
config.resolver.disableHierarchicalLookup = false;

// 4. Add extra node modules that might be hoisted
config.resolver.extraNodeModules = {
  // This ensures Metro can find expo at the monorepo root
  expo: path.resolve(monorepoRoot, 'node_modules/expo'),
};

module.exports = config;
