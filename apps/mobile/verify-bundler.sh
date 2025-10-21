#!/bin/bash

# Verification script for Metro bundler fix
# This script checks if the bundler configuration is correct

echo "================================================"
echo "Metro Bundler Configuration Verification"
echo "================================================"
echo ""

PROJECT_DIR="/home/hieutt50/projects/numerologist/apps/mobile"
cd "$PROJECT_DIR"

# Check 1: Verify index.js exists
echo "[1/6] Checking custom entry point (index.js)..."
if [ -f "index.js" ]; then
    echo "✓ index.js exists"
    echo "   Content:"
    cat index.js | sed 's/^/   /'
else
    echo "✗ index.js NOT FOUND"
    exit 1
fi
echo ""

# Check 2: Verify package.json main field
echo "[2/6] Checking package.json main field..."
MAIN_FIELD=$(grep -o '"main": "[^"]*"' package.json)
if [[ "$MAIN_FIELD" == *"index.js"* ]]; then
    echo "✓ package.json main field is correct: $MAIN_FIELD"
else
    echo "✗ package.json main field is incorrect: $MAIN_FIELD"
    echo "   Expected: \"main\": \"index.js\""
    exit 1
fi
echo ""

# Check 3: Verify metro.config.js has monorepo configuration
echo "[3/6] Checking metro.config.js configuration..."
if grep -q "watchFolders" metro.config.js && grep -q "nodeModulesPaths" metro.config.js; then
    echo "✓ metro.config.js has monorepo configuration"
    echo "   Key configurations found:"
    grep -E "(watchFolders|nodeModulesPaths|extraNodeModules)" metro.config.js | sed 's/^/   /'
else
    echo "✗ metro.config.js missing monorepo configuration"
    exit 1
fi
echo ""

# Check 4: Verify App.tsx exists
echo "[4/6] Checking App.tsx exists..."
if [ -f "App.tsx" ]; then
    echo "✓ App.tsx exists at: $PROJECT_DIR/App.tsx"
    echo "   First few lines:"
    head -n 5 App.tsx | sed 's/^/   /'
else
    echo "✗ App.tsx NOT FOUND"
    exit 1
fi
echo ""

# Check 5: Verify monorepo root structure
echo "[5/6] Checking monorepo root structure..."
MONOREPO_ROOT="/home/hieutt50/projects/numerologist"
if [ -f "$MONOREPO_ROOT/nx.json" ]; then
    echo "✓ Monorepo root exists with nx.json"
    if [ -d "$MONOREPO_ROOT/node_modules/expo" ]; then
        echo "✓ Expo package found at monorepo root"
    else
        echo "⚠ Expo package NOT found at monorepo root"
        echo "   This may be okay if using local node_modules"
    fi
else
    echo "✗ Monorepo root structure incorrect"
    exit 1
fi
echo ""

# Check 6: Verify caches are clear
echo "[6/6] Checking for stale caches..."
if [ -d ".expo" ] || [ -d "node_modules/.cache" ] || [ -d ".metro" ]; then
    echo "⚠ Cache directories found - recommend clearing:"
    [ -d ".expo" ] && echo "   - .expo/"
    [ -d "node_modules/.cache" ] && echo "   - node_modules/.cache/"
    [ -d ".metro" ] && echo "   - .metro/"
    echo ""
    echo "   Run: rm -rf .expo node_modules/.cache .metro"
else
    echo "✓ No cache directories found"
fi
echo ""

echo "================================================"
echo "Verification Complete!"
echo "================================================"
echo ""
echo "Configuration Status: ✓ READY"
echo ""
echo "To test the bundler, run:"
echo "  npx expo start --clear --web"
echo ""
echo "Or use the startup script:"
echo "  ./start-mobile.sh"
echo ""
