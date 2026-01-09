# Quick Start Guide

## TL;DR - Run the Plugin on Your File

### Step 1: Link the Plugin (One-Time Setup)

```bash
# In the plugin directory (D:\W\prettier-plugin-relative-imports)
npm link

# In your webapp directory
cd D:\W\Upriver\webapp-next
npm link prettier-plugin-relative-imports
```

### Step 2: Create Prettier Config

Create `D:\W\Upriver\webapp-next\.prettierrc.json`:

```json
{
  "plugins": ["prettier-plugin-relative-imports"],
  "absolutePathPrefix": "@/",
  "maxRelativePathDepth": 1
}
```

### Step 3: Run Prettier on Your File

```bash
cd D:\W\Upriver\webapp-next

# Preview changes (without modifying):
npx prettier "app/[lang]/(app)/(no-header)/agent/task-list-item.tsx"

# Apply changes:
npx prettier --write "app/[lang]/(app)/(no-header)/agent/task-list-item.tsx"
```

## Expected Result

**Before (line 5):**
```typescript
import { EllipsisContainer } from "../../../../../components/ellipsis-container/ellipsis-container";
```

**After:**
```typescript
import { EllipsisContainer } from "@/components/ellipsis-container/ellipsis-container";
```

## Alternative: Use the Setup Script

### On Windows:

```bash
# Run the setup script
setup-and-test.bat

# Then manually run:
cd D:\W\Upriver\webapp-next
npx prettier --config .prettierrc.test.json --write "app/[lang]/(app)/(no-header)/agent/task-list-item.tsx"
```

### On Linux/Mac:

```bash
chmod +x setup-and-test.sh
./setup-and-test.sh
```

## Verify It's Working

Check if the plugin is loaded:

```bash
cd D:\W\Upriver\webapp-next
npx prettier --help | grep -i "absolute"
```

You should see the plugin options listed.

## Troubleshooting

### "Cannot find module 'prettier-plugin-relative-imports'"

The plugin isn't linked. Run:
```bash
cd D:\W\prettier-plugin-relative-imports
npm link

cd D:\W\Upriver\webapp-next
npm link prettier-plugin-relative-imports
```

### File isn't being changed

1. Check that the import has 2+ `../` segments (depth > 1)
2. Verify `.prettierrc.json` exists and has `plugins` array
3. Try with explicit config: `npx prettier --config .prettierrc.json --write file.tsx`

### Want to format all files in your project?

```bash
cd D:\W\Upriver\webapp-next
npx prettier --write "app/**/*.{ts,tsx}"
npx prettier --write "components/**/*.{ts,tsx}"
```

## One-Liner (After Setup)

```bash
cd D:\W\Upriver\webapp-next && npx prettier --write "app/[lang]/(app)/(no-header)/agent/task-list-item.tsx"
```

