# Testing Quick Reference

## Running Tests

```bash
# Run all tests
npm test

# Run all tests with coverage report
npm test -- --coverage

# Run specific test file
npm test text-transformer.test.js

# Run example tests only
npm test text-transformer.example.test.js

# Run in watch mode (re-runs on file changes)
npm test -- --watch

# Run with verbose output
npm test -- --verbose
```

## Test Files

| File | Description | Test Count |
|------|-------------|------------|
| `text-transformer.test.js` | Comprehensive test suite | 24 tests |
| `text-transformer.example.test.js` | Example transformation | 4 tests |

## Key Test Cases

### Example Transformation Test

Tests the exact transformation requested:

```javascript
// Input
import { EllipsisContainer } from "../../../../../components/ellipsis-container/ellipsis-container";

// Output
import { EllipsisContainer } from "@/components/ellipsis-container/ellipsis-container";
```

**Run**: `npm test -- --testNamePattern="should transform the exact import"`

### Depth Calculation Test

```javascript
calculateRelativeDepth("../../../../../file.tsx") // Returns: 5
```

**Run**: `npm test -- --testNamePattern="depth calculation"`

### Multiple Imports Test

Tests a complete file with various import types.

**Run**: `npm test -- --testNamePattern="complete task-list-item"`

## Mock Structure

The `path-resolver` module is fully mocked:

```javascript
jest.mock("./path-resolver", () => ({
  detectNextJs: jest.fn(),
  findProjectRoot: jest.fn(),
  loadConfig: jest.fn(),
  findConfigFile: jest.fn(),
  convertToAbsolutePath: jest.fn(),
  resolveRelativePath: jest.fn(),
}));
```

## Test Coverage

Current coverage for `text-transformer.js`:

- ✅ **92.3%** Statements
- ✅ **78.37%** Branches
- ✅ **100%** Functions
- ✅ **92.3%** Lines

View detailed coverage:
```bash
npm test -- --coverage
# Open: coverage/lcov-report/index.html
```

## Writing New Tests

To add new test cases:

```javascript
it("should [describe what it does]", () => {
  // 1. Setup mocks
  pathResolver.resolveRelativePath.mockReturnValue("absolute/path");
  pathResolver.convertToAbsolutePath.mockReturnValue("@/path");

  // 2. Define input
  const input = `import { X } from "../../../x";`;
  
  // 3. Transform
  const result = transformText(input, filePath);
  
  // 4. Assert
  expect(result).toBe(`import { X } from "@/x";`);
});
```

## Debugging Tests

Enable debug output:

```bash
DEBUG=true npm test
```

Or set in test:

```javascript
process.env.DEBUG = "true";
```

## Common Test Patterns

### Test Single Import
```javascript
const input = `import { Component } from "../../path";`;
const result = transformText(input, filePath);
expect(result).toContain('@/path');
```

### Test Multiple Imports
```javascript
pathResolver.resolveRelativePath
  .mockReturnValueOnce("path1")
  .mockReturnValueOnce("path2");

const result = transformText(multiLineInput, filePath);
```

### Test Error Handling
```javascript
pathResolver.resolveRelativePath.mockImplementation(() => {
  throw new Error("Test error");
});

const result = transformText(input, filePath);
expect(result).toBe(input); // Original preserved
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Run tests
  run: npm test

- name: Check coverage
  run: npm test -- --coverage --coverageThreshold='{"global":{"statements":90}}'
```

## Continuous Testing

For development, use watch mode:

```bash
npm test -- --watch
```

This will:
- ✅ Re-run tests on file changes
- ✅ Show only failed tests after first run
- ✅ Allow filtering by test name or file

## Test Output

Successful run shows:

```
Test Suites: 2 passed, 2 total
Tests:       28 passed, 28 total
Snapshots:   0 total
Time:        ~0.6s
```

## Need Help?

- **Test documentation**: See `TEST_DOCUMENTATION.md`
- **Test summary**: See `TEST_SUMMARY.md`
- **Jest docs**: https://jestjs.io/docs/getting-started

