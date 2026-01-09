/**
 * Example test demonstrating the exact transformation requested:
 * 
 * From: import { EllipsisContainer } from "../../../../../components/ellipsis-container/ellipsis-container";
 * To:   import { EllipsisContainer } from "@/components/ellipsis-container/ellipsis-container";
 * 
 * File: D:\W\Upriver\webapp-next\app\[lang]\(app)\(no-header)\agent\task-list-item.tsx
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
  convertToAbsolutePath: jest.fn((absolutePath, projectRoot) => {
    // Simulate converting absolute path to @/ prefix
    const relative = absolutePath.replace(/\\/g, "/").split("webapp-next/")[1];
    if (relative) {
      return "@/" + relative.replace(/\.(tsx|ts|jsx|js)$/, "");
    }
    return null;
  }),
  resolveRelativePath: jest.fn((importPath, currentFilePath) => {
    // Simulate resolving relative path
    // From: ../../../../../components/ellipsis-container/ellipsis-container
    // Current file: D:\W\Upriver\webapp-next\app\[lang]\(app)\(no-header)\agent\task-list-item.tsx
    // Result: D:\W\Upriver\webapp-next\components\ellipsis-container\ellipsis-container.tsx
    
    if (importPath === "../../../../../components/ellipsis-container/ellipsis-container") {
      return "D:\\W\\Upriver\\webapp-next\\components\\ellipsis-container\\ellipsis-container.tsx";
    }
    return null;
  }),
}));

describe("Example: task-list-item.tsx transformation", () => {
  const testFilePath =
    "D:\\W\\Upriver\\webapp-next\\app\\[lang]\\(app)\\(no-header)\\agent\\task-list-item.tsx";

  it("should transform the exact import from the example", () => {
    const input = `import { EllipsisContainer } from "../../../../../components/ellipsis-container/ellipsis-container";`;
    const expected = `import { EllipsisContainer } from "@/components/ellipsis-container/ellipsis-container";`;

    const result = transformText(input, testFilePath);

    expect(result).toBe(expected);
  });

  it("should transform a complete task-list-item.tsx file", () => {
    const input = `import React from "react";
import { EllipsisContainer } from "../../../../../components/ellipsis-container/ellipsis-container";
import { Card } from "../../../../../components/ui/card";
import { Badge } from "../../../../../components/ui/badge";
import { LocalUtils } from "./utils";

interface TaskListItemProps {
  title: string;
  status: string;
}

export function TaskListItem({ title, status }: TaskListItemProps) {
  return (
    <Card>
      <EllipsisContainer>
        <h3>{title}</h3>
        <Badge>{status}</Badge>
      </EllipsisContainer>
    </Card>
  );
}`;

    const pathResolver = require("./path-resolver");

    // Setup additional mocks for the other imports
    pathResolver.resolveRelativePath
      .mockReturnValueOnce(
        "D:\\W\\Upriver\\webapp-next\\components\\ellipsis-container\\ellipsis-container.tsx"
      )
      .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\components\\ui\\card.tsx")
      .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\components\\ui\\badge.tsx");

    pathResolver.convertToAbsolutePath
      .mockReturnValueOnce("@/components/ellipsis-container/ellipsis-container")
      .mockReturnValueOnce("@/components/ui/card")
      .mockReturnValueOnce("@/components/ui/badge");

    const result = transformText(input, testFilePath, {
      maxRelativePathDepth: 1,
    });

    // Check that deep imports were transformed
    expect(result).toContain(
      'import { EllipsisContainer } from "@/components/ellipsis-container/ellipsis-container";'
    );
    expect(result).toContain('import { Card } from "@/components/ui/card";');
    expect(result).toContain('import { Badge } from "@/components/ui/badge";');

    // Check that shallow imports and external packages were NOT transformed
    expect(result).toContain('import React from "react";');
    expect(result).toContain('import { LocalUtils } from "./utils";');

    // Check that the rest of the file is preserved
    expect(result).toContain("export function TaskListItem");
    expect(result).toContain("<EllipsisContainer>");
  });

  it("should show the depth calculation for the example path", () => {
    const { calculateRelativeDepth } = require("./text-transformer");

    const importPath = "../../../../../components/ellipsis-container/ellipsis-container";
    const depth = calculateRelativeDepth(importPath);

    expect(depth).toBe(5);
  });

  it("should determine that the example path needs transformation", () => {
    const { shouldTransform } = require("./text-transformer");

    const importPath = "../../../../../components/ellipsis-container/ellipsis-container";
    const maxDepth = 1; // Default

    const result = shouldTransform(importPath, maxDepth);

    expect(result).toBe(true); // 5 levels > 1 max depth
  });
});

