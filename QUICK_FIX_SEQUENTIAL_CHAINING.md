# Quick Fix: Sequential Parser Chaining

## ✅ Solution Implemented

Our plugin now **automatically chains** with `prettier-plugin-organize-imports` to ensure both plugins run sequentially!

## 🚀 How to Use

**Load our plugin LAST:**

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

## 🔄 What Happens

1. **Our plugin runs FIRST** (transforms paths: `../../../../../` → `@/`)
2. **organize-imports runs SECOND** (organizes and sorts imports)
3. **Both transformations apply!** ✅

## 🧪 Test It

```bash
# Run the test
node test-sequential-chaining.js

# Or test on your file
npx prettier --write "app/[lang]/(app)/(no-header)/agent/task-list-item.tsx"
```

## 📋 Expected Result

**Before:**
```typescript
import { EllipsisContainer } from "../../../../../components/ellipsis-container/ellipsis-container";
import { Card } from "../../../../../components/ui/card";
import React from "react";
```

**After (both plugins working):**
```typescript
import React from "react";
import { Card } from "@/components/ui/card";
import { EllipsisContainer } from "@/components/ellipsis-container/ellipsis-container";
```

## ⚠️ If It Doesn't Work

Use **separate Prettier passes**:

```bash
# Step 1: Transform paths
npx prettier --config .prettierrc.paths.json --write "src/**/*.{ts,tsx}"

# Step 2: Organize imports  
npx prettier --config .prettierrc.organize.json --write "src/**/*.{ts,tsx}"
```

See **`SEQUENTIAL_PARSER_CHAINING.md`** for full details.

