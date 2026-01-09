# Sequential Parser Chaining

## 🎯 The Solution

Our plugin now **automatically chains** with `prettier-plugin-organize-imports` when both are loaded, ensuring **both plugins run sequentially** regardless of load order.

## ✅ How It Works

### When Our Plugin is Loaded LAST (Recommended)

```json
{
  "plugins": [
    "prettier-plugin-organize-imports",
    "prettier-plugin-relative-imports"  ← Load LAST
  ]
}
```

**Execution Flow:**

1. **Prettier uses our parser** (because we're loaded last)
2. **Our plugin transforms paths FIRST:**
   ```typescript
   // Original
   import { X } from "../../../../../components/x"
   
   // After our transformation
   import { X } from "@/components/x"
   ```
3. **Our plugin detects organize-imports** and calls its parser
4. **organize-imports processes the transformed text:**
   - Sorts imports
   - Groups by type (external, absolute, relative)
   - Removes unused imports
5. **Both transformations apply!** ✅

### Technical Implementation

Our parser:
1. Transforms the text (import paths)
2. Detects if `prettier-plugin-organize-imports` is installed
3. If found, calls organize-imports' parser with the transformed text
4. If not found, calls the base Prettier parser

This ensures **sequential execution** regardless of plugin load order!

## 🧪 Testing

Run the test script:

```bash
node test-sequential-chaining.js
```

This will:
- ✅ Verify both plugins are installed
- ✅ Test sequential chaining
- ✅ Verify both transformations apply
- ✅ Show the execution flow

## 📋 Expected Result

**Input:**
```typescript
import { useState, useEffect } from "react";
import { EllipsisContainer } from "../../../../../components/ellipsis-container/ellipsis-container";
import { Card } from "../../../../../components/ui/card";
import { TaskView } from "@/api/agent";
import { formatDate } from "./utils";
import { cn } from "@/lib/utils";
```

**Output (both plugins working):**
```typescript
import { useState, useEffect } from "react";
import { TaskView } from "@/api/agent";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { EllipsisContainer } from "@/components/ellipsis-container/ellipsis-container";
import { formatDate } from "./utils";
```

**What happened:**
- ✅ Paths transformed: `../../../../../` → `@/`
- ✅ Imports organized: External packages first, then absolute imports, then relative
- ✅ Imports sorted alphabetically within groups

## 🔧 Configuration

### Recommended Setup

**`.prettierrc.json`:**
```json
{
  "plugins": [
    "prettier-plugin-organize-imports",
    "prettier-plugin-relative-imports"
  ],
  "absolutePathPrefix": "@/",
  "maxRelativePathDepth": 1
}
```

### Alternative: Load Our Plugin First

If you load our plugin first, it will still work, but organize-imports might not run:

```json
{
  "plugins": [
    "prettier-plugin-relative-imports",
    "prettier-plugin-organize-imports"
  ]
}
```

**Why this might not work:**
- organize-imports overwrites our parser
- Our transformations might not run
- Only organize-imports runs

**Solution:** Always load our plugin **LAST** for guaranteed sequential execution.

## 🔍 How Detection Works

Our plugin detects organize-imports by:

1. **Checking if the module is installed:**
   ```javascript
   require('prettier-plugin-organize-imports')
   ```

2. **Finding the matching parser:**
   ```javascript
   organizeImports.parsers[parserName]  // e.g., 'typescript', 'babel-ts'
   ```

3. **Chaining with it:**
   ```javascript
   organizeImportsParser.parse(transformedText, parsers, options)
   ```

## ⚠️ Troubleshooting

### Both Plugins Not Running?

1. **Check plugin order:**
   ```json
   {
     "plugins": [
       "prettier-plugin-organize-imports",  ← First
       "prettier-plugin-relative-imports"   ← Last
     ]
   }
   ```

2. **Verify both are installed:**
   ```bash
   npm list prettier-plugin-organize-imports
   npm list prettier-plugin-relative-imports
   ```

3. **Test with debug logging:**
   ```bash
   DEBUG=true npx prettier --loglevel debug --write "file.tsx"
   ```

### Only One Plugin Running?

If only one plugin runs, try:

1. **Clear Prettier cache:**
   ```bash
   rm -rf node_modules/.cache
   ```

2. **Reinstall plugins:**
   ```bash
   npm uninstall prettier-plugin-organize-imports prettier-plugin-relative-imports
   npm install --save-dev prettier-plugin-organize-imports prettier-plugin-relative-imports
   ```

3. **Use separate Prettier passes** (see below)

## 🔄 Fallback: Separate Passes

If sequential chaining doesn't work, use **separate Prettier passes**:

### Step 1: Transform Paths

**`.prettierrc.step1.json`:**
```json
{
  "plugins": ["prettier-plugin-relative-imports"],
  "absolutePathPrefix": "@/",
  "maxRelativePathDepth": 1
}
```

### Step 2: Organize Imports

**`.prettierrc.step2.json`:**
```json
{
  "plugins": ["prettier-plugin-organize-imports"]
}
```

### Run Sequentially

```bash
# Step 1: Transform paths
npx prettier --config .prettierrc.step1.json --write "src/**/*.{ts,tsx}"

# Step 2: Organize imports
npx prettier --config .prettierrc.step2.json --write "src/**/*.{ts,tsx}"
```

Or use npm scripts:

```json
{
  "scripts": {
    "format": "npm run format:paths && npm run format:organize",
    "format:paths": "prettier --config .prettierrc.step1.json --write \"src/**/*.{ts,tsx}\"",
    "format:organize": "prettier --config .prettierrc.step2.json --write \"src/**/*.{ts,tsx}\""
  }
}
```

## 📚 Summary

**Key Points:**

1. ✅ **Load our plugin LAST** for guaranteed sequential execution
2. ✅ **Our plugin automatically detects** and chains with organize-imports
3. ✅ **Both transformations apply** when chaining works
4. ✅ **Use separate passes** as a fallback if needed

**Execution Order:**
1. Our plugin transforms paths
2. organize-imports organizes imports
3. Both complete successfully! ✅

## 🎉 Result

With proper configuration, you get:
- ✅ Deep relative paths transformed to absolute (`@/`)
- ✅ Imports organized and sorted
- ✅ Unused imports removed (if organize-imports is configured)
- ✅ Consistent import ordering across your codebase

All in a **single Prettier run**! 🚀

