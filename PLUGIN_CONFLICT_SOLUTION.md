# Fixing Conflicts with prettier-plugin-organize-imports

## 🔴 The Problem

Both `prettier-plugin-relative-imports` and `prettier-plugin-organize-imports` override the same parsers (TypeScript, Babel). When multiple plugins override the same parser, **only one wins** - typically the last one loaded.

### What Happens:
```
Plugin A overrides typescript parser → Plugin B overrides it again → Only Plugin B runs
```

## ✅ Solutions

### Solution 1: Plugin Load Order (Easiest)

Load `prettier-plugin-relative-imports` **FIRST**, then `organize-imports`:

**`.prettierrc.json`:**
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

**Why this works:**
1. Our plugin transforms `../../../../../path` → `@/path`
2. Then organize-imports sorts the (already transformed) imports
3. Both transformations apply ✅

### Solution 2: Use Plugin Compostion (Advanced)

Create a combined plugin that does both:

**`prettier-plugin-combined.js`:**
```javascript
const relativeImports = require('prettier-plugin-relative-imports');
const organizeImports = require('prettier-plugin-organize-imports');

module.exports = {
  parsers: {
    typescript: {
      ...relativeImports.parsers.typescript,
      parse: (text, parsers, options) => {
        // 1. Transform paths first
        const transformed = relativeImports.parsers.typescript.parse(
          text, 
          parsers, 
          options
        );
        
        // 2. Then organize imports
        return organizeImports.parsers.typescript.parse(
          transformed, 
          parsers, 
          options
        );
      }
    },
    // ... other parsers
  },
  options: {
    ...relativeImports.options,
    ...organizeImports.options,
  }
};
```

### Solution 3: Run Separately (Most Reliable)

Run the plugins in sequence using multiple Prettier passes:

**`package.json`:**
```json
{
  "scripts": {
    "format": "npm run format:paths && npm run format:organize",
    "format:paths": "prettier --config .prettierrc.paths.json --write \"src/**/*.{ts,tsx}\"",
    "format:organize": "prettier --config .prettierrc.organize.json --write \"src/**/*.{ts,tsx}\""
  }
}
```

**`.prettierrc.paths.json`:**
```json
{
  "plugins": ["prettier-plugin-relative-imports"],
  "absolutePathPrefix": "@/",
  "maxRelativePathDepth": 1
}
```

**`.prettierrc.organize.json`:**
```json
{
  "plugins": ["prettier-plugin-organize-imports"]
}
```

### Solution 4: Use Pre-commit Hook

Use both plugins in separate steps:

**`.husky/pre-commit`:**
```bash
#!/bin/sh

# Step 1: Transform import paths
npx prettier --config .prettierrc.paths.json --write $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$')

# Step 2: Organize imports
npx prettier --config .prettierrc.organize.json --write $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$')

# Re-add the formatted files
git add $(git diff --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$')
```

## 🧪 Test Which Solution Works

### Test Script: `test-plugin-order.js`

```javascript
const prettier = require('prettier');
const fs = require('fs');

const testCode = `
import { Component } from "../../../../../components/test";
import { useState } from "react";
import { utils } from "./utils";
`;

async function testFormat(config) {
  return prettier.format(testCode, {
    ...config,
    parser: 'typescript',
    filepath: 'test.tsx',
  });
}

// Test with both plugins
testFormat({
  plugins: [
    'prettier-plugin-relative-imports',
    'prettier-plugin-organize-imports'
  ],
  absolutePathPrefix: '@/',
  maxRelativePathDepth: 1,
}).then(result => {
  console.log('Result with both plugins:\n', result);
});
```

Run:
```bash
node test-plugin-order.js
```

## 📋 Recommended Approach

**For most projects, use Solution 1 (Plugin Load Order):**

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

**If that doesn't work, use Solution 3 (Run Separately):**

```bash
npm run format:paths && npm run format:organize
```

## 🔍 Debugging Plugin Conflicts

### Check which plugins are loaded:

```bash
npx prettier --list-different --loglevel debug "src/**/*.tsx" 2>&1 | grep -i plugin
```

### Check parser order:

Create `debug-plugins.js`:
```javascript
const prettier = require('prettier');
const config = prettier.resolveConfig.sync('./');
console.log('Loaded plugins:', config.plugins);
console.log('Parser info:', prettier.getSupportInfo());
```

Run:
```bash
node debug-plugins.js
```

## 🎯 Why Our Plugin Goes First

When you load plugins in this order:
```json
["prettier-plugin-relative-imports", "prettier-plugin-organize-imports"]
```

**Execution flow:**
1. ✅ `relative-imports` transforms: `../../../../../path` → `@/path`
2. ✅ `organize-imports` sees already-transformed imports and sorts them
3. ✅ Both transformations apply correctly

**If reversed:**
```json
["prettier-plugin-organize-imports", "prettier-plugin-relative-imports"]
```

1. ⚠️ `organize-imports` sorts the original imports
2. ❌ `relative-imports` **might not run** (parser already overridden)
3. ❌ Paths don't get transformed

## 📚 Additional Resources

- [Prettier Plugin Docs](https://prettier.io/docs/en/plugins.html)
- [prettier-plugin-organize-imports](https://github.com/simonhaenisch/prettier-plugin-organize-imports)
- [Plugin Conflicts Discussion](https://github.com/prettier/prettier/issues/8683)

## 💡 Future Improvement

Consider creating a unified plugin that combines both functionalities:
- Transform relative imports to absolute
- Organize and sort imports
- Single parser override, no conflicts!

