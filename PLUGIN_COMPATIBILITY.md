# Plugin Compatibility Guide

## ✅ Test Results

Our plugin successfully transforms imports:

```typescript
// BEFORE
import { EllipsisContainer } from "../../../../../components/ellipsis-container/ellipsis-container";
import { Card } from "../../../../../components/ui/card";

// AFTER
import { EllipsisContainer } from "@/components/ellipsis-container/ellipsis-container";
import { Card } from "@/components/ui/card";
```

## 🔄 Working with `prettier-plugin-organize-imports`

### Why Conflicts Happen

Both plugins override the **same parsers**:
- `typescript`
- `babel-ts`
- `babel`

When multiple plugins override the same parser, Prettier uses the **last one loaded**, causing the other plugin's transformations to be skipped.

### ✅ Solution: Correct Plugin Order

**Load our plugin FIRST:**

```json
{
  "plugins": [
    "prettier-plugin-relative-imports",
    "prettier-plugin-organize-imports"
  ],
  "absolutePathPrefix": "@/",
  "maxRelativePathDepth": 1
}
```

### How It Works

1. **Step 1 - Our plugin runs:**
   ```typescript
   // Transforms:
   import { X } from "../../../../../components/x"
   // To:
   import { X } from "@/components/x"
   ```

2. **Step 2 - organize-imports runs:**
   ```typescript
   // Sorts the already-transformed imports:
   import { X } from "@/components/x"
   import { Y } from "@/lib/y"
   import React from "react"
   ```

3. **✅ Result: Both transformations applied!**

## 🧪 Test It Yourself

Run the test script:

```bash
node test-with-organize-imports.js
```

Or test manually:

```bash
# Install organize-imports
npm install --save-dev prettier-plugin-organize-imports

# Create test config
cat > .prettierrc.test.json << 'EOF'
{
  "plugins": [
    "prettier-plugin-relative-imports",
    "prettier-plugin-organize-imports"
  ],
  "absolutePathPrefix": "@/",
  "maxRelativePathDepth": 1
}
EOF

# Test on your file
npx prettier --config .prettierrc.test.json --write "app/[lang]/(app)/(no-header)/agent/task-list-item.tsx"
```

## 📋 Other Compatible Plugins

Our plugin should work with:

| Plugin | Compatible | Notes |
|--------|------------|-------|
| `prettier-plugin-organize-imports` | ✅ Yes | Load our plugin first |
| `prettier-plugin-tailwindcss` | ✅ Yes | Different parsers, no conflict |
| `prettier-plugin-sort-imports` | ⚠️ Maybe | Load our plugin first, test order |
| `prettier-plugin-import-sort` | ⚠️ Maybe | Load our plugin first, test order |

## ⚠️ If Plugins Still Conflict

Use **separate Prettier passes**:

### Create two configs:

**`.prettierrc.step1.json`** (Transform paths):
```json
{
  "plugins": ["prettier-plugin-relative-imports"],
  "absolutePathPrefix": "@/",
  "maxRelativePathDepth": 1
}
```

**`.prettierrc.step2.json`** (Organize imports):
```json
{
  "plugins": ["prettier-plugin-organize-imports"]
}
```

### Run sequentially:

```bash
# Step 1: Transform paths
npx prettier --config .prettierrc.step1.json --write "src/**/*.{ts,tsx}"

# Step 2: Organize imports
npx prettier --config .prettierrc.step2.json --write "src/**/*.{ts,tsx}"
```

Or add to `package.json`:

```json
{
  "scripts": {
    "format": "npm run format:transform && npm run format:organize",
    "format:transform": "prettier --config .prettierrc.step1.json --write \"src/**/*.{ts,tsx}\"",
    "format:organize": "prettier --config .prettierrc.step2.json --write \"src/**/*.{ts,tsx}\""
  }
}
```

## 🔍 Debugging

### Check which plugins are active:

```bash
npx prettier --help | grep -A 20 "Global options"
```

Look for:
- `--absolute-path-prefix` (our plugin)
- `--max-relative-path-depth` (our plugin)

### Test plugin loading:

```javascript
const prettier = require('prettier');
const config = prettier.resolveConfig.sync('.');
console.log('Plugins:', config?.plugins);
```

### Enable debug logging:

```bash
npx prettier --loglevel debug --write "file.tsx" 2>&1 | grep plugin
```

## 💡 Best Practices

1. **Always list `prettier-plugin-relative-imports` FIRST** in the plugins array
2. **Test the plugin order** with your specific plugin combination
3. **Use separate configs** if conflicts persist
4. **Run tests** after changing plugin order: `npm test`

## 📚 More Information

See **`PLUGIN_CONFLICT_SOLUTION.md`** for:
- Detailed technical explanation
- Alternative solutions
- Advanced plugin composition techniques
- Troubleshooting guide

