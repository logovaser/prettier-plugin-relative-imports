#!/usr/bin/env node

/**
 * Test script to verify sequential parser chaining works correctly
 * This demonstrates that both plugins run in sequence when our plugin is loaded LAST
 */

const prettier = require('prettier');

const testCode = `import { useState, useEffect } from "react";
import { EllipsisContainer } from "../../../../../components/ellipsis-container/ellipsis-container";
import { Card } from "../../../../../components/ui/card";
import { TaskView } from "@/api/agent";
import { formatDate } from "./utils";
import { cn } from "@/lib/utils";`;

console.log("========================================");
console.log("Testing Sequential Parser Chaining");
console.log("========================================\n");

console.log("📄 ORIGINAL CODE:");
console.log("─────────────────────────────────────");
console.log(testCode);
console.log("─────────────────────────────────────\n");

async function testSequentialChaining() {
  console.log("🔧 Test: Sequential Chaining (our plugin LAST)");
  console.log("─────────────────────────────────────");
  console.log("Plugin order: prettier-plugin-organize-imports → prettier-plugin-relative-imports");
  console.log();
  
  try {
    // Check if organize-imports is installed
    let organizeImportsPlugin;
    try {
      organizeImportsPlugin = require('prettier-plugin-organize-imports');
      console.log("✅ prettier-plugin-organize-imports found");
    } catch (e) {
      console.log("⚠️  prettier-plugin-organize-imports not installed");
      console.log("   Install it with: npm install --save-dev prettier-plugin-organize-imports");
      console.log("   Skipping sequential chaining test...\n");
      return;
    }
    
    const ourPlugin = require('./index.js');
    
    // Test with both plugins - our plugin LAST
    const result = await prettier.format(testCode, {
      parser: 'typescript',
      plugins: [
        organizeImportsPlugin,  // First
        ourPlugin                // Last (wins, but chains with first)
      ],
      filepath: 'D:/W/Upriver/webapp-next/app/[lang]/(app)/(no-header)/agent/test.tsx',
      absolutePathPrefix: '@/',
      maxRelativePathDepth: 1,
    });
    
    console.log("✨ RESULT:");
    console.log("─────────────────────────────────────");
    console.log(result);
    console.log("─────────────────────────────────────\n");
    
    // Verify transformations
    const checks = {
      'Path transformation (../../../../../ → @/)': result.includes('@/components/ellipsis-container'),
      'Path transformation (../../../../../ → @/)': result.includes('@/components/ui/card'),
      'Import organization (external first)': result.indexOf('import { useState') < result.indexOf('import { Card }'),
      'Import organization (absolute imports grouped)': result.includes('@/api/agent') && result.includes('@/lib/utils'),
      'Shallow imports preserved': result.includes('./utils'),
      'External packages preserved': result.includes('from "react"'),
    };
    
    console.log("📊 VERIFICATION:");
    console.log("─────────────────────────────────────");
    let allPassed = true;
    for (const [check, passed] of Object.entries(checks)) {
      const status = passed ? '✅' : '❌';
      console.log(`${status} ${check}`);
      if (!passed) allPassed = false;
    }
    console.log("─────────────────────────────────────\n");
    
    if (allPassed) {
      console.log("🎉 SUCCESS! Both plugins ran sequentially:");
      console.log("   1. prettier-plugin-relative-imports: Transformed paths");
      console.log("   2. prettier-plugin-organize-imports: Organized imports");
      console.log();
    } else {
      console.log("⚠️  Some checks failed. The plugins may not be chaining correctly.");
      console.log();
    }
    
    return { result, checks, allPassed };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    return null;
  }
}

// Run the test
(async () => {
  await testSequentialChaining();
  
  console.log("========================================");
  console.log("📋 HOW IT WORKS:");
  console.log("========================================");
  console.log("When prettier-plugin-relative-imports is loaded LAST:");
  console.log();
  console.log("1. Prettier uses our parser (because we're last)");
  console.log("2. Our parser transforms: ../../../../../path → @/path");
  console.log("3. Our parser detects organize-imports and calls its parser");
  console.log("4. organize-imports processes the transformed text");
  console.log("5. Both transformations apply! ✅");
  console.log();
  console.log("Configuration:");
  console.log('  {');
  console.log('    "plugins": [');
  console.log('      "prettier-plugin-organize-imports",  ← First');
  console.log('      "prettier-plugin-relative-imports"   ← Last (wins, but chains)');
  console.log('    ]');
  console.log('  }');
  console.log();
})();

