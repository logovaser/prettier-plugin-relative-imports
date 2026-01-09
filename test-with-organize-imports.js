#!/usr/bin/env node

/**
 * Test script to verify compatibility with prettier-plugin-organize-imports
 * 
 * This demonstrates the recommended plugin order:
 * 1. prettier-plugin-relative-imports (transforms paths)
 * 2. prettier-plugin-organize-imports (sorts imports)
 */

const prettier = require('prettier');

const testCode = `import { useState, useEffect } from "react";
import { EllipsisContainer } from "../../../../../components/ellipsis-container/ellipsis-container";
import { Card } from "../../../../../components/ui/card";
import { TaskView } from "@/api/agent";
import { formatDate } from "./utils";
import { cn } from "@/lib/utils";

export function Component() {
  return <div>Test</div>;
}`;

console.log("========================================");
console.log("Testing Plugin Compatibility");
console.log("========================================\n");

console.log("📄 ORIGINAL CODE:");
console.log("─────────────────────────────────────");
console.log(testCode);
console.log("─────────────────────────────────────\n");

// Test with just our plugin
async function testWithRelativeImportsOnly() {
  console.log("🔧 Test 1: Only prettier-plugin-relative-imports");
  console.log("─────────────────────────────────────");
  
  try {
    const result = await prettier.format(testCode, {
      parser: 'typescript',
      plugins: ['./index.js'],
      filepath: 'D:/W/Upriver/webapp-next/app/[lang]/(app)/(no-header)/agent/test.tsx',
      absolutePathPrefix: '@/',
      maxRelativePathDepth: 1,
    });
    
    console.log(result);
    console.log("✅ Success!\n");
    return result;
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log();
  }
}

// Test with both plugins (if organize-imports is installed)
async function testWithBothPlugins() {
  console.log("🔧 Test 2: Both plugins (if organize-imports installed)");
  console.log("─────────────────────────────────────");
  
  try {
    // Check if organize-imports is available
    require.resolve('prettier-plugin-organize-imports');
    
    const result = await prettier.format(testCode, {
      parser: 'typescript',
      plugins: [
        './index.js',
        'prettier-plugin-organize-imports'
      ],
      filepath: 'D:/W/Upriver/webapp-next/app/[lang]/(app)/(no-header)/agent/test.tsx',
      absolutePathPrefix: '@/',
      maxRelativePathDepth: 1,
    });
    
    console.log(result);
    console.log("✅ Success! Both plugins work together!\n");
    return result;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log("ℹ️  prettier-plugin-organize-imports not installed - skipping this test");
      console.log("   To test: npm install --save-dev prettier-plugin-organize-imports\n");
    } else {
      console.error("❌ Error:", error.message);
      console.log();
    }
  }
}

// Run tests
(async () => {
  await testWithRelativeImportsOnly();
  await testWithBothPlugins();
  
  console.log("========================================");
  console.log("📋 EXPECTED TRANSFORMATIONS:");
  console.log("========================================");
  console.log("1. ../../../../../components/ellipsis-container → @/components/ellipsis-container");
  console.log("2. ../../../../../components/ui/card → @/components/ui/card");
  console.log("3. @/api/agent → unchanged (already absolute)");
  console.log("4. ./utils → unchanged (shallow relative)");
  console.log("5. @/lib/utils → unchanged (already absolute)");
  console.log();
  console.log("If organize-imports is also installed:");
  console.log("6. Imports will be sorted and grouped");
  console.log();
})();

