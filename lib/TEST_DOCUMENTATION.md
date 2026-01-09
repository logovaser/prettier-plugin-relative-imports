# Text Transformer Unit Tests

This document describes the unit tests for `text-transformer.js`.

## Overview

The test suite covers all exported functions from `text-transformer.js`:
- `calculateRelativeDepth`
- `shouldTransform`
- `transformText`

## Test Setup

The tests use **Jest** as the testing framework and **mock** the `./path-resolver` module to isolate the text-transformer logic.

### Mocked Functions

All functions from `path-resolver.js` are mocked:
- `detectNextJs()`
- `findProjectRoot()`
- `loadConfig()`
- `findConfigFile()`
- `convertToAbsolutePath()`
- `resolveRelativePath()`

This allows us to test the transformation logic independently of the file system.

## Test Suites

### 1. calculateRelativeDepth

Tests the depth calculation for relative import paths.

**Test Cases:**
- Non-relative paths (e.g., `lodash`, `@/components`) → returns 0
- Current directory paths (e.g., `./utils`) → returns 0
- Single parent directory (e.g., `../utils`) → returns 1
- Multiple levels (e.g., `../../../../../components`) → returns 5
- Complex paths with multiple segments

### 2. shouldTransform

Tests the decision logic for whether an import should be transformed.

**Test Cases:**
- Paths within `maxRelativePathDepth` → returns false (no transformation)
- Paths exceeding `maxRelativePathDepth` → returns true (should transform)
- Different `maxRelativePathDepth` values (1, 2, etc.)

### 3. transformText

Tests the main transformation function with various scenarios.

**Test Cases:**

#### Basic Transformation
- Deep relative import → absolute import
  ```javascript
  // Input
  import { EllipsisContainer } from "../../../../../components/ellipsis-container/ellipsis-container";
  
  // Output
  import { EllipsisContainer } from "@/components/ellipsis-container/ellipsis-container";
  ```

#### Edge Cases
- Shallow relative imports (not transformed)
- Multiple imports in the same file
- Single quotes preservation
- Trailing semicolon handling
- Various import statement types:
  - Default imports: `import Component from "..."`
  - Named imports: `import { named } from "..."`
  - Multiple named: `import { a, b, c } from "..."`
  - Namespace imports: `import * as All from "..."`
  - Type imports: `import type { Type } from "..."`

#### require() Statements
- Basic require transformation
- Quote style preservation
- Mixed import/require in same file

#### Configuration Options
- Custom `absolutePathPrefix` (e.g., `~/`)
- Custom `maxRelativePathDepth`
- Explicit `nextjsMode` option
- Custom `tsconfigPath` option

#### Error Handling
- Graceful handling of transformation errors
- Original code preserved on failure

#### Real-World Scenarios
- Complex file with multiple imports from different sources
- Mix of relative and absolute imports
- Third-party package imports (not transformed)

## Test Data

The tests use a realistic file path based on the provided example:

```
File: D:\W\Upriver\webapp-next\app\[lang]\(app)\(no-header)\agent\task-list-item.tsx
Project Root: D:\W\Upriver\webapp-next
```

This simulates a real Next.js project structure with nested route groups.

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## Coverage

The test suite achieves **92.3%** code coverage for `text-transformer.js`, covering:
- 92.3% of statements
- 78.37% of branches
- 100% of functions
- 92.3% of lines

Uncovered lines are primarily debug/error logging statements.

## Key Testing Principles

1. **Isolation**: Path resolver is mocked to test transformation logic independently
2. **Comprehensive**: Tests cover all major code paths and edge cases
3. **Real-world**: Test data based on actual project structure
4. **Maintainable**: Clear test descriptions and organized test suites
5. **Fast**: Tests run in < 1 second

## Future Test Enhancements

Potential areas for additional testing:
- Performance testing with large files (1000+ imports)
- Integration tests with real file system
- Edge cases with unusual quote characters or escape sequences
- Testing with different OS path separators (Windows vs Unix)

