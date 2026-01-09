# How to Use This Prettier Plugin

## Installation

### Option 1: Link Locally (For Testing)

From the plugin directory:
```bash
# In D:\W\prettier-plugin-relative-imports
npm link

# In your project directory
cd D:\W\Upriver\webapp-next
npm link prettier-plugin-relative-imports
```

### Option 2: Install from npm (When Published)

```bash
cd D:\W\Upriver\webapp-next
npm install --save-dev prettier-plugin-relative-imports
```

### Option 3: Install from Local Path

```bash
cd D:\W\Upriver\webapp-next
npm install --save-dev file:../prettier-plugin-relative-imports
```

## Configuration

Create or update `.prettierrc` in your project root (`D:\W\Upriver\webapp-next`):

```json
{
  "plugins": ["prettier-plugin-relative-imports"],
  "absolutePathPrefix": "@/",
  "maxRelativePathDepth": 1
}
```

### ⚠️ Using with Other Plugins (e.g., organize-imports)

If you use `prettier-plugin-organize-imports` or other plugins, **order matters**!

**Recommended order:**
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

This ensures paths are transformed FIRST, then imports are organized.

See **`PLUGIN_CONFLICT_SOLUTION.md`** for detailed solutions if you experience conflicts.

Or use `.prettierrc.js`:

```javascript
module.exports = {
  plugins: ["prettier-plugin-relative-imports"],
  absolutePathPrefix: "@/",
  maxRelativePathDepth: 1,
  // Optional:
  // tsconfigPath: "./tsconfig.json",
  // nextjsMode: true
};
```

## Running Prettier

### Format a specific file:

```bash
npx prettier --write "D:\W\Upriver\webapp-next\app\[lang]\(app)\(no-header)\agent\task-list-item.tsx"
```

Or with shorter path from project root:
```bash
cd D:\W\Upriver\webapp-next
npx prettier --write "app/[lang]/(app)/(no-header)/agent/task-list-item.tsx"
```

### Check without modifying:

```bash
npx prettier --check "app/[lang]/(app)/(no-header)/agent/task-list-item.tsx"
```

### Format entire directory:

```bash
npx prettier --write "app/**/*.{ts,tsx,js,jsx}"
```

## Plugin Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `absolutePathPrefix` | string | `"@/"` | Prefix for absolute imports |
| `maxRelativePathDepth` | int | `1` | Max depth before converting (1 = `../` preserved) |
| `tsconfigPath` | string | `""` | Path to tsconfig.json (auto-detected if empty) |
| `nextjsMode` | boolean | `false` | Enable Next.js optimizations (auto-detected) |

## Example Transformations

### Your File: task-list-item.tsx

**Before:**
```typescript
import { EllipsisContainer } from "../../../../../components/ellipsis-container/ellipsis-container";
```

**After:**
```typescript
import { EllipsisContainer } from "@/components/ellipsis-container/ellipsis-container";
```

### What Gets Transformed:

- ✅ `../../../../../path` → `@/path` (5 levels up)
- ✅ `../../path` → `@/path` (2+ levels up)
- ❌ `../path` → stays as `../path` (1 level, within threshold)
- ❌ `./path` → stays as `./path` (same directory)
- ❌ External packages like `react`, `next/navigation` → unchanged

## Troubleshooting

### Plugin Not Running?

1. **Check Prettier is installed:**
   ```bash
   npm list prettier
   ```

2. **Check plugin is loaded:**
   ```bash
   npx prettier --help
   # Should show plugin options in help text
   ```

3. **Try with explicit parser:**
   ```bash
   npx prettier --write --parser typescript "app/[lang]/(app)/(no-header)/agent/task-list-item.tsx"
   ```

### No Changes Being Made?

1. **Check file is being processed:**
   ```bash
   npx prettier --loglevel debug --write "app/[lang]/(app)/(no-header)/agent/task-list-item.tsx"
   ```

2. **Verify paths meet depth threshold:**
   - Default `maxRelativePathDepth: 1` means only paths with 2+ `../` segments are transformed
   - Your file has `../../../../../` (5 levels) so it should transform

3. **Check tsconfig.json exists:**
   The plugin looks for path mappings in `tsconfig.json`

## Integration with VS Code

Add to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Integration with Git Hooks (husky + lint-staged)

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "prettier --write"
    ]
  }
}
```

## Testing the Plugin

Run our test suite to verify:

```bash
cd D:\W\prettier-plugin-relative-imports
npm test
```

All 38 tests should pass! ✅

