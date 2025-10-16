# import.meta Error Fix - Documentation

## Problem
The app was encountering this error during web build:
```
Uncaught SyntaxError: Cannot use 'import.meta' outside a module
```

This occurred because certain dependencies (`sucrase`, `@react-native/debugger-frontend`) use `import.meta` syntax, which is incompatible with the Hermes JavaScript engine when used in non-module contexts.

## Root Cause
- `sucrase` is a JavaScript transformer that uses `import.meta.url` to resolve paths
- `@react-native/debugger-frontend` (dev-only tools) also uses `import.meta` 
- These were being bundled into the Hermes bundle, where `import.meta` isn't supported in non-module contexts

## Solutions Applied

### 1. **babel.config.js** - Enable import.meta polyfill
```javascript
presets: [
  [
    'babel-preset-expo',
    {
      unstable_transformImportMeta: true,  // ← Polyfill for import.meta
    },
  ],
],
ignore: [
  'node_modules/@react-native/debugger-frontend',
  'node_modules/sucrase',
  'node_modules/@react-native/inspector',
],
```

### 2. **metro.config.js** - Exclude problematic packages from bundling
```javascript
const exclusionList = [
  /node_modules\/@react-native\/debugger-frontend\/.*/,
  /node_modules\/sucrase\/.*/,
  /node_modules\/@react-native\/inspector\/.*/,
];

config.resolver.blockList = (config.resolver.blockList || []).concat(exclusionList);
```

### 3. **.babelignore** - Prevent Babel from processing these packages
```
node_modules/@react-native/debugger-frontend
node_modules/sucrase
node_modules/@react-native/inspector
```

## How to Rebuild

After these changes, clear the cache and rebuild:

```bash
# For Android development
npm run android

# For iOS development
npm run ios

# For Web development
npm run web

# Or clear cache completely and start fresh
npm run clear-cache
```

## What This Does

1. **Metro Bundler**: Prevents these packages from being included in the bundle entirely
2. **Babel Transformer**: 
   - Enables the `unstable_transformImportMeta` polyfill to convert `import.meta` to module context
   - Ignores files in problematic packages to skip transformation
3. **Hermes Engine**: Now receives a bundle where `import.meta` is either:
   - Not present (excluded packages)
   - Properly transpiled for module context (other code)

## Expected Result

The build should now complete successfully without the `import.meta` error. The app should:
- Bundle correctly for Android
- Bundle correctly for iOS
- Bundle correctly for Web (including with Hermes)

## If Issues Persist

If you still encounter `import.meta` errors after these changes:

1. Check if any local code uses `import.meta` - if so, remove it or ensure it's used only in true ES modules
2. Run `npm run clear-cache` to ensure no stale cache
3. Delete `node_modules` and run `npm install` again if the issue persists
4. Check if new dependencies have been added that use `import.meta`

## Reference Files Modified

- `babel.config.js` - Updated Babel preset configuration
- `metro.config.js` - Created new Metro bundler configuration
- `.babelignore` - Created new file to ignore problematic packages
