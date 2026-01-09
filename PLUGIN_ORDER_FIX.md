# Fix: Plugin Order for prettier-plugin-organize-imports

## 🔴 The Problem

When both plugins are loaded in sequence:
```json
{
  "plugins": [
    "prettier-plugin-relative-imports",
    "prettier-plugin-organize-imports"
  ]
}
```

**Only `organize-imports` runs** because it's loaded last and overwrites our parser registration.

## ✅ The Solution

**Load `prettier-plugin-relative-imports` LAST:**

```json
{
  "plugins": [
    "prettier-plugin-organize-imports",
    "prettier-plugin-relative-imports"  ← Load LAST
  ],
  "absolutePathPrefix": "@/",
  "maxRelativePathDepth": 1
}
```

## 🔄 How It Works Now

When our plugin is loaded **LAST**, it **automatically chains** with organize-imports:

1. **Our plugin transforms the text FIRST:**
   ```typescript
   // Original
   import { X } from "../../../../../components/x"
   
   // After our transformation
   import { X } from "@/components/x"
   ```

2. **Our plugin detects organize-imports** and calls its parser with the transformed text

3. **organize-imports processes the transformed text:**
   - Sorts imports
   - Groups by type
   - Removes unused imports

4. **Both transformations apply sequentially!** ✅

**This is automatic** - our plugin detects organize-imports and chains with it!

## 🧪 Test It

```bash
# Install organize-imports if not already installed
npm install --save-dev prettier-plugin-organize-imports

# Create test config with correct order
cat > .prettierrc.test.json << 'EOF'
{
  "plugins": [
    "prettier-plugin-organize-imports",
    "prettier-plugin-relative-imports"
  ],
  "absolutePathPrefix": "@/",
  "maxRelativePathDepth": 1
}
EOF

# Test on your file
npx prettier --config .prettierrc.test.json --write "app/[lang]/(app)/(no-header)/agent/task-list-item.tsx"
```

## 📋 Expected Result

**Before:**
```typescript
import { useState } from "react";
import { EllipsisContainer } from "../../../../../components/ellipsis-container/ellipsis-container";
import { Card } from "../../../../../components/ui/card";
import { TaskView } from "@/api/agent";
```

**After (both plugins working):**
```typescript
import { useState } from "react";
import { TaskView } from "@/api/agent";
import { Card } from "@/components/ui/card";
import { EllipsisContainer } from "@/components/ellipsis-container/ellipsis-container";
```

Notice:
- ✅ Paths transformed: `../../../../../` → `@/`
- ✅ Imports organized: External packages first, then absolute imports, sorted

## ⚠️ If It Still Doesn't Work

Some versions of `prettier-plugin-organize-imports` might not work with parser chaining. In that case, use **separate Prettier passes**:

### Option 1: Two-Step Process

**`.prettierrc.step1.json`:**
```json
{
  "plugins": ["prettier-plugin-relative-imports"],
  "absolutePathPrefix": "@/",
  "maxRelativePathDepth": 1
}
```

**`.prettierrc.step2.json`:**
```json
{
  "plugins": ["prettier-plugin-organize-imports"]
}
```

**Run:**
```bash
# Step 1: Transform paths
npx prettier --config .prettierrc.step1.json --write "src/**/*.{ts,tsx}"

# Step 2: Organize imports
npx prettier --config .prettierrc.step2.json --write "src/**/*.{ts,tsx}"
```

### Option 2: npm Scripts

**`package.json`:**
```json
{
  "scripts": {
    "format": "npm run format:paths && npm run format:organize",
    "format:paths": "prettier --config .prettierrc.step1.json --write \"src/**/*.{ts,tsx}\"",
    "format:organize": "prettier --config .prettierrc.step2.json --write \"src/**/*.{ts,tsx}\""
  }
}
```

## 🔍 Debugging

### Check if plugins are loaded:

```bash
npx prettier --help | grep -i "absolute\|organize"
```

### Test with debug logging:

```bash
npx prettier --loglevel debug --write "file.tsx" 2>&1 | grep -i plugin
```

### Verify transformations:

```bash
# Before
cat file.tsx | grep -E "\.\.\/\.\.\/"

# After (should show @/ paths)
npx prettier --config .prettierrc.test.json file.tsx | grep -E "@/"
```

## 📚 Summary

**Key Point:** Load `prettier-plugin-relative-imports` **LAST** in the plugins array!

```json
{
  "plugins": [
    "prettier-plugin-organize-imports",  ← First
    "prettier-plugin-relative-imports"   ← Last (wins, but transforms first)
  ]
}
```

This ensures:
1. Our plugin's parser is the one Prettier uses (because we're last)
2. We transform the text before parsing
3. organize-imports can still process the result
4. Both transformations apply! ✅

