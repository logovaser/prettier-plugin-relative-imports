/**
 * Demonstration test showing the bug fix in action
 * This test uses a complete real-world task-list-item.tsx file
 */

const { transformText } = require("./text-transformer");

// Mock the path-resolver module
jest.mock("./path-resolver", () => ({
  detectNextJs: jest.fn(() => true),
  findProjectRoot: jest.fn(() => "D:\\W\\Upriver\\webapp-next"),
  loadConfig: jest.fn(() => ({
    compilerOptions: {
      baseUrl: ".",
      paths: {
        "@/*": ["./*"],
      },
    },
  })),
  findConfigFile: jest.fn(() => ({
    path: "D:\\W\\Upriver\\webapp-next\\tsconfig.json",
    type: "tsconfig",
  })),
  convertToAbsolutePath: jest.fn(),
  resolveRelativePath: jest.fn(),
}));

describe("Bug Fix Demonstration: task-list-item.tsx", () => {
  const testFilePath =
    "D:\\W\\Upriver\\webapp-next\\app\\[lang]\\(app)\\(no-header)\\agent\\task-list-item.tsx";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("DEMO: Complete task-list-item.tsx with code that should NOT be transformed", () => {
    // This is a realistic component file with:
    // 1. Deep relative imports (SHOULD transform)
    // 2. Import examples in comments (should NOT transform)
    // 3. Import examples in JSX (should NOT transform)
    // 4. Path strings in code (should NOT transform)
    
    const realWorldFile = `import React, { useState } from "react";
import { EllipsisContainer } from "../../../../../components/ellipsis-container/ellipsis-container";
import { Card, CardHeader, CardContent } from "../../../../../components/ui/card";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { useRouter } from "next/navigation";
import { formatDate } from "./utils";

interface TaskListItemProps {
  id: string;
  title: string;
  status: "pending" | "in-progress" | "completed";
  description: string;
  createdAt: Date;
}

/**
 * TaskListItem component for displaying individual tasks
 * 
 * @example
 * // Import and use like this:
 * import { TaskListItem } from "../../../../../app/[lang]/(app)/(no-header)/agent/task-list-item"
 * 
 * <TaskListItem
 *   id="123"
 *   title="My Task"
 *   status="in-progress"
 *   description="Task description"
 *   createdAt={new Date()}
 * />
 */
export function TaskListItem({
  id,
  title,
  status,
  description,
  createdAt,
}: TaskListItemProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    router.push(\`/agent/tasks/\${id}\`);
  };

  // For debugging - shows import path
  const debugInfo = process.env.NODE_ENV === "development" 
    ? 'This component is at: import { TaskListItem } from "../../../../../app/task-list-item"'
    : null;

  return (
    <Card onClick={handleClick} className="cursor-pointer hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <EllipsisContainer className="flex-1">
            <h3 className="text-lg font-semibold">{title}</h3>
          </EllipsisContainer>
          <Badge variant={status === "completed" ? "success" : "default"}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <EllipsisContainer lines={isExpanded ? undefined : 2}>
          <p className="text-sm text-gray-600">{description}</p>
        </EllipsisContainer>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {formatDate(createdAt)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? "Show less" : "Show more"}
          </Button>
        </div>
        {debugInfo && (
          <div className="mt-2 text-xs text-gray-400 font-mono">
            {debugInfo}
            {/* Also available via: const component = require("../../../../../app/task-list-item") */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function for testing - shows how to import
export function getImportExample() {
  return {
    esm: 'import { TaskListItem } from "../../../../../app/[lang]/(app)/(no-header)/agent/task-list-item"',
    cjs: 'const { TaskListItem } = require("../../../../../app/[lang]/(app)/(no-header)/agent/task-list-item")',
  };
}`;

    const pathResolver = require("./path-resolver");
    
    // Setup mocks for the 4 deep imports
    pathResolver.resolveRelativePath
      .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\components\\ellipsis-container\\ellipsis-container.tsx")
      .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\components\\ui\\card.tsx")
      .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\components\\ui\\badge.tsx")
      .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\components\\ui\\button.tsx");

    pathResolver.convertToAbsolutePath
      .mockReturnValueOnce("@/components/ellipsis-container/ellipsis-container")
      .mockReturnValueOnce("@/components/ui/card")
      .mockReturnValueOnce("@/components/ui/badge")
      .mockReturnValueOnce("@/components/ui/button");

    const result = transformText(realWorldFile, testFilePath);

    // ===== VERIFY: Actual imports WERE transformed =====
    console.log("\n========================================");
    console.log("✅ IMPORTS SECTION - TRANSFORMED:");
    console.log("========================================");
    
    expect(result).toContain('import { EllipsisContainer } from "@/components/ellipsis-container/ellipsis-container"');
    console.log("✓ EllipsisContainer import transformed to @/");
    
    expect(result).toContain('import { Card, CardHeader, CardContent } from "@/components/ui/card"');
    console.log("✓ Card components import transformed to @/");
    
    expect(result).toContain('import { Badge } from "@/components/ui/badge"');
    console.log("✓ Badge import transformed to @/");
    
    expect(result).toContain('import { Button } from "@/components/ui/button"');
    console.log("✓ Button import transformed to @/");

    // ===== VERIFY: External imports NOT transformed =====
    expect(result).toContain('import React, { useState } from "react"');
    console.log("✓ React import unchanged (external package)");
    
    expect(result).toContain('import { useRouter } from "next/navigation"');
    console.log("✓ Next.js import unchanged (external package)");
    
    expect(result).toContain('import { formatDate } from "./utils"');
    console.log("✓ Local relative import unchanged (shallow)");

    // ===== VERIFY: Code content was NOT transformed =====
    console.log("\n========================================");
    console.log("✅ CODE SECTION - NOT TRANSFORMED:");
    console.log("========================================");
    
    expect(result).toContain('import { TaskListItem } from "../../../../../app/[lang]/(app)/(no-header)/agent/task-list-item"');
    console.log("✓ JSDoc example preserved (in comment)");
    
    expect(result).toContain('This component is at: import { TaskListItem } from "../../../../../app/task-list-item"');
    console.log("✓ String literal in code preserved");
    
    expect(result).toContain('const component = require("../../../../../app/task-list-item")');
    console.log("✓ Comment with require() preserved");
    
    expect(result).toContain('esm: \'import { TaskListItem } from "../../../../../app/[lang]/(app)/(no-header)/agent/task-list-item"\'');
    console.log("✓ String in returned object preserved");
    
    expect(result).toContain('cjs: \'const { TaskListItem } = require("../../../../../app/[lang]/(app)/(no-header)/agent/task-list-item")\'');
    console.log("✓ Another string in returned object preserved");

    // ===== VERIFY: Structure preserved =====
    console.log("\n========================================");
    console.log("✅ FILE STRUCTURE - PRESERVED:");
    console.log("========================================");
    
    expect(result).toContain('interface TaskListItemProps');
    console.log("✓ TypeScript interface preserved");
    
    expect(result).toContain('export function TaskListItem');
    console.log("✓ Component export preserved");
    
    expect(result).toContain('export function getImportExample');
    console.log("✓ Helper function export preserved");
    
    expect(result).toContain('<Card onClick={handleClick}');
    console.log("✓ JSX structure preserved");
    
    expect(result).toContain('<EllipsisContainer className="flex-1">');
    console.log("✓ JSX components preserved");

    console.log("\n========================================");
    console.log("✅ ALL CHECKS PASSED!");
    console.log("========================================\n");

    // Count to verify we didn't accidentally transform code
    const transformedImports = (result.match(/@\/components\//g) || []).length;
    expect(transformedImports).toBe(4); // Should match number of actual import statements (4 lines)
    
    // Check for any preserved relative paths (../../../ or more)
    const preservedDeepPaths = (result.match(/\.\.\/\.\.\/\.\.\//g) || []).length;
    expect(preservedDeepPaths).toBeGreaterThan(0); // Should still have deep paths in comments/strings
    console.log(`✓ Preserved ${preservedDeepPaths} deep path(s) in code/comments`);
  });
});

