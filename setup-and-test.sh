#!/bin/bash

# Quick setup and test script for the Prettier plugin

echo "========================================="
echo "Prettier Plugin Setup & Test"
echo "========================================="
echo ""

PLUGIN_DIR="$PWD"
TARGET_PROJECT="D:/W/Upriver/webapp-next"
TARGET_FILE="app/[lang]/(app)/(no-header)/agent/task-list-item.tsx"

echo "Step 1: Link plugin locally"
echo "─────────────────────────────────────"
npm link
echo ""

echo "Step 2: Link plugin to target project"
echo "─────────────────────────────────────"
cd "$TARGET_PROJECT" || exit 1
npm link prettier-plugin-relative-imports
echo ""

echo "Step 3: Create/Update .prettierrc"
echo "─────────────────────────────────────"
cat > .prettierrc.test.json << 'EOF'
{
  "plugins": ["prettier-plugin-relative-imports"],
  "absolutePathPrefix": "@/",
  "maxRelativePathDepth": 1,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all"
}
EOF
echo "Created .prettierrc.test.json"
echo ""

echo "Step 4: Check file before formatting"
echo "─────────────────────────────────────"
echo "Current import on line 5:"
head -n 5 "$TARGET_FILE" | tail -n 1
echo ""

echo "Step 5: Run Prettier (dry-run)"
echo "─────────────────────────────────────"
npx prettier --config .prettierrc.test.json --check "$TARGET_FILE" && echo "No changes needed" || echo "Changes would be made"
echo ""

echo "Step 6: Run Prettier (actual format)"
echo "─────────────────────────────────────"
echo "To format the file, run:"
echo "  cd $TARGET_PROJECT"
echo "  npx prettier --config .prettierrc.test.json --write \"$TARGET_FILE\""
echo ""

echo "Or to test without modifying:"
echo "  npx prettier --config .prettierrc.test.json \"$TARGET_FILE\" > formatted-output.tsx"
echo ""

echo "========================================="
echo "Setup complete!"
echo "========================================="

