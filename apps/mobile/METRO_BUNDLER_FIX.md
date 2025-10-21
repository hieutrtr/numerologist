# Metro Bundler Path Resolution Fix for Nx Monorepo

## Problem Summary

**Error:** `Unable to resolve "../../App" from "node_modules/expo/AppEntry.js"`

### Root Cause

The issue occurred due to a mismatch between Expo's default entry point expectations and the Nx monorepo structure:

1. **Original Configuration:**
   - `package.json` had `"main": "expo/AppEntry.js"`
   - This resolved to `/home/hieutt50/projects/numerologist/node_modules/expo/AppEntry.js` (at monorepo root)

2. **Hardcoded Import in AppEntry.js:**
   ```javascript
   import App from '../../App';
   ```
   - This tried to resolve: `/home/hieutt50/projects/numerologist/node_modules/expo/../../App`
   - Which equals: `/home/hieutt50/projects/numerologist/App.tsx` (doesn't exist!)

3. **Actual App Location:**
   - App.tsx is at `/home/hieutt50/projects/numerologist/apps/mobile/App.tsx`

4. **Metro Bundler Issue:**
   - Metro didn't understand the monorepo structure
   - Couldn't resolve the path mismatch between expected and actual App location

## Solution Implemented

### 1. Updated Metro Configuration (`/home/hieutt50/projects/numerologist/apps/mobile/metro.config.js`)

Added monorepo-aware configuration:

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Force Metro to resolve symlinked packages
config.resolver.disableHierarchicalLookup = false;

// Add extra node modules that might be hoisted
config.resolver.extraNodeModules = {
  expo: path.resolve(monorepoRoot, 'node_modules/expo'),
};

module.exports = config;
```

**What this does:**
- `watchFolders`: Allows Metro to watch the entire monorepo for changes
- `nodeModulesPaths`: Tells Metro to look for packages in both app-level and monorepo-level node_modules
- `disableHierarchicalLookup: false`: Enables proper package resolution in monorepo
- `extraNodeModules`: Explicitly maps expo to the monorepo root's node_modules

### 2. Created Custom Entry Point (`/home/hieutt50/projects/numerologist/apps/mobile/index.js`)

```javascript
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```

**Benefits:**
- Direct import from `./App` (local to apps/mobile)
- No dependency on Expo's default AppEntry.js path resolution
- Full control over the entry point

### 3. Updated package.json

Changed:
```json
"main": "expo/AppEntry.js"
```

To:
```json
"main": "index.js"
```

### 4. Cleared All Caches

- Removed `.expo`, `.metro`, and `node_modules/.cache` directories
- Ran `npx nx reset` to clear Nx build cache

## Why This Fix Works

1. **Metro Configuration:**
   - Metro now understands the monorepo structure
   - Can resolve packages from both app-level and monorepo-level node_modules
   - Watches the entire workspace for file changes

2. **Custom Entry Point:**
   - Bypasses Expo's default AppEntry.js completely
   - Uses a local import path (`./App`) that's relative to apps/mobile
   - Eliminates the `../../App` resolution issue entirely

3. **Monorepo-Aware Resolution:**
   - `watchFolders` allows Metro to traverse up to the monorepo root
   - `nodeModulesPaths` ensures packages hoisted to root are found
   - `extraNodeModules` provides explicit path mapping for critical packages

## Testing Instructions

1. **Start the development server:**
   ```bash
   cd /home/hieutt50/projects/numerologist/apps/mobile
   npx expo start --clear
   ```

2. **Test web bundling specifically:**
   ```bash
   cd /home/hieutt50/projects/numerologist/apps/mobile
   npx expo start --web
   ```

3. **Verify all platforms:**
   - Press `w` for web
   - Press `i` for iOS (if on Mac)
   - Press `a` for Android

## Common Issues and Solutions

### Issue: "Module not found" errors for workspace packages

**Solution:** Ensure babel.config.js includes module resolution:
```javascript
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './src',
        },
      },
    ],
  ],
};
```

### Issue: Changes not reflecting in app

**Solution:** Clear all caches:
```bash
cd /home/hieutt50/projects/numerologist/apps/mobile
rm -rf .expo node_modules/.cache .metro
npx expo start --clear
```

### Issue: "Unable to resolve module" for shared libraries

**Solution:** Add to metro.config.js:
```javascript
config.resolver.extraNodeModules = {
  '@numerologist/shared': path.resolve(monorepoRoot, 'libs/shared/src'),
  '@numerologist/numerology': path.resolve(monorepoRoot, 'libs/numerology/src'),
  // ... other shared libraries
};
```

## File Structure Reference

```
/home/hieutt50/projects/numerologist/          (monorepo root)
├── node_modules/
│   └── expo/
│       └── AppEntry.js                         (old entry point - no longer used)
├── apps/
│   └── mobile/
│       ├── index.js                            (NEW: custom entry point)
│       ├── App.tsx                             (main app component)
│       ├── package.json                        (main: "index.js")
│       ├── metro.config.js                     (UPDATED: monorepo-aware)
│       └── src/
├── libs/
│   ├── shared/
│   ├── numerology/
│   └── ui/
└── nx.json
```

## Additional Resources

- [Metro Bundler Configuration](https://metrobundler.dev/docs/configuration)
- [Expo Monorepo Guide](https://docs.expo.dev/guides/monorepos/)
- [Nx React Native Plugin](https://nx.dev/packages/react-native)

## Verification Checklist

- [x] Metro config includes watchFolders pointing to monorepo root
- [x] Metro config includes nodeModulesPaths for both app and root
- [x] Custom index.js entry point created
- [x] package.json main field updated to "index.js"
- [x] All caches cleared (Expo, Metro, Nx)
- [ ] Test web bundling: `npx expo start --web`
- [ ] Test iOS bundling: `npx expo start --ios`
- [ ] Test Android bundling: `npx expo start --android`

## Next Steps

1. Run the mobile app: `./start-mobile.sh`
2. Press `w` to test web bundling
3. Verify no "Unable to resolve" errors
4. Test app functionality on all target platforms

If you encounter any issues, check:
1. Node version compatibility (recommended: Node 18+ LTS)
2. Expo CLI version: `npx expo --version`
3. Metro bundler cache: `rm -rf .metro`
4. Watchman cache (if on Mac): `watchman watch-del-all`
