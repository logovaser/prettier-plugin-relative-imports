# Prettier Plugin: Relative Imports

A Prettier plugin that automatically converts deep relative import paths to absolute paths while preserving shallow relative imports.

## Features

- 🔄 Converts deep relative imports (e.g., `../../../../file.js`) to absolute paths (e.g., `@/app/file.js`)
- ✅ Preserves shallow relative imports (`../file.js` and `./file.js`)
- 🚀 Zero configuration needed for Next.js 14+ projects
- 📦 Supports JavaScript, TypeScript, JSX, TSX, and Vue files
- 🎯 Respects `tsconfig.json` and `jsconfig.json` path mappings
- 🔍 Auto-detects Next.js projects

## Installation

```bash
npm install --save-dev prettier-plugin-relative-imports
```

_Note: `prettier` is a peer dependency, so make sure you have it installed._

## Usage

### Prettier 3

Add the plugin to your Prettier configuration:

```json
{
  "plugins": ["prettier-plugin-relative-imports"],
  "absolutePathPrefix": "@/",
  "maxRelativePathDepth": 1
}
```

### Prettier 2

The plugin will be loaded automatically. You can still configure it in your `.prettierrc`:

```json
{
  "absolutePathPrefix": "@/",
  "maxRelativePathDepth": 1
}
```

## Configuration

### `absolutePathPrefix` (default: `"@/"`)

The prefix to use for absolute import paths. Common values:
- `"@/"` - Maps to project root (common in Next.js)
- `"@/app/"` - Maps to app directory
- `"~/components/"` - Custom prefix

### `maxRelativePathDepth` (default: `1`)

The maximum depth of relative paths before converting to absolute. 
- `1` means `../` and `./` are preserved, but `../../` and deeper are converted
- `0` means only `./` is preserved
- `2` means `../` and `../../` are preserved, but `../../../` and deeper are converted

### `tsconfigPath` (optional)

Path to `tsconfig.json` or `jsconfig.json`. If not provided, the plugin will auto-detect it by searching up from the file being processed.

### `nextjsMode` (optional, auto-detected)

Enable Next.js 14+ specific optimizations. The plugin automatically detects Next.js projects by checking for:
- `next.config.js`, `next.config.mjs`, or `next.config.ts`
- `next` dependency in `package.json`

## Examples

### Before
```typescript
// app/components/deep/nested/very/DeepComponent.tsx
import { formatDate } from "../../../../../lib/utils/helpers";
import { Button } from "../../../../components/Button";
import { helper } from "../utils/helper"; // Preserved (depth 1)
```

### After
```typescript
// app/components/deep/nested/very/DeepComponent.tsx
import { formatDate } from "@/lib/utils/helpers";
import { Button } from "@/components/Button";
import { helper } from "../utils/helper"; // Preserved (depth 1)
```

## Next.js 14+ Support

The plugin works seamlessly with Next.js 14+ projects:

- Automatically detects Next.js projects
- Respects `tsconfig.json` or `jsconfig.json` path mappings
- Works with the App Router directory structure
- Supports the default `@/*` path alias

### Example Next.js Configuration

Your `tsconfig.json` might look like:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

The plugin will use this configuration to resolve paths correctly.

## How It Works

1. The plugin intercepts Prettier's parsing process
2. It analyzes each import statement to determine the relative path depth
3. If the depth exceeds `maxRelativePathDepth`, it:
   - Resolves the relative path to an absolute file path
   - Maps it to the configured absolute path prefix using `tsconfig.json`/`jsconfig.json` if available
   - Replaces the import path in the source code
4. Prettier then formats the transformed code

## Compatibility

- Prettier 2.x and 3.x
- Next.js 14+
- TypeScript and JavaScript projects
- Vue.js projects (with `vue-tsc` installed)

## License

MIT

