#!/usr/bin/env node

/**
 * Test script to verify plugin chaining works correctly
 */

const prettier = require('prettier');
const fs = require('fs');

const testCode = `import { useState } from "react";
import { EllipsisContainer } from "../../../../../components/ellipsis-container/ellipsis-container";
import { Card } from "../../../../../components/ui/card";
import { TaskView } from "@/api/agent";
import { formatDate } from "./utils";`;

console.log("========================================");
console.log("Testing Plugin Chaining");
console.log("========================================\n");

console.log("📄 ORIGINAL CODE:");
console.log("─────────────────────────────────────");
console.log(testCode);
console.log("─────────────────────────────────────\n");

async function testPluginOrder(order, description) {
  console.log(`\n🔧 Test: ${description}`);
  console.log(`   Plugin order: ${order.join(' → ')}`);
  console.log("─────────────────────────────────────");
  
  try {
    const plugins = order.map(name => {
      if (name === 'relative-imports') {
        return require('./index.js');
      }
      try {
        return require(name);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
    
    if (plugins.length !== order.length) {
      console.log(`⚠️  Some plugins not found, skipping...`);
      return null;
    }
    
    const result = await prettier.format(testCode, {
      parser: 'typescript',
      plugins: plugins,
      filepath: 'D:/W/Upriver/webapp-next/app/[lang]/(app)/(no-header)/agent/test.tsx',
      absolutePathPrefix: '@/',
      maxRelativePathDepth: 1,
    });
    
    console.log(result);
    
    // Check if transformations happened
    const hasTransformed = result.includes('@/components/ellipsis-container');
    const hasOrganized = result.includes('import React') && 
                        result.indexOf('import React') < result.indexOf('import {');
    
    console.log(`\n✅ Path transformation: ${hasTransformed ? 'YES' : 'NO'}`);
    console.log(`✅ Import organization: ${hasOrganized ? 'YES' : 'NO'}`);
    
    return { result, hasTransformed, hasOrganized };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    return null;
  }
}

(async () => {
  // Test 1: Our plugin first (current issue - only organize-imports runs)
  await testPluginOrder(
    ['prettier-plugin-relative-imports', 'prettier-plugin-organize-imports'],
    'Our plugin FIRST (current broken order)'
  );
  
  // Test 2: Our plugin last (should work)
  await testPluginOrder(
    ['prettier-plugin-organize-imports', 'prettier-plugin-relative-imports'],
    'Our plugin LAST (should work)'
  );
  
  // Test 3: Only our plugin
  await testPluginOrder(
    ['prettier-plugin-relative-imports'],
    'Only our plugin'
  );
  
  console.log("\n========================================");
  console.log("📋 RECOMMENDATION:");
  console.log("========================================");
  console.log("If Test 2 works but Test 1 doesn't:");
  console.log("  → Load prettier-plugin-relative-imports LAST");
  console.log("  → This ensures our transformations run, then organize-imports processes the result");
  console.log("");
})();

