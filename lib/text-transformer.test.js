const {
  calculateRelativeDepth,
  shouldTransform,
  transformText,
} = require("./text-transformer");

// Mock the path-resolver module
jest.mock("./path-resolver", () => ({
  detectNextJs: jest.fn(),
  findProjectRoot: jest.fn(),
  loadConfig: jest.fn(),
  findConfigFile: jest.fn(),
  convertToAbsolutePath: jest.fn(),
  resolveRelativePath: jest.fn(),
}));

const pathResolver = require("./path-resolver");

describe("text-transformer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("calculateRelativeDepth", () => {
    it("should return 0 for non-relative paths", () => {
      expect(calculateRelativeDepth("lodash")).toBe(0);
      expect(calculateRelativeDepth("@/components/button")).toBe(0);
      expect(calculateRelativeDepth("react")).toBe(0);
    });

    it("should return 0 for current directory", () => {
      expect(calculateRelativeDepth("./utils")).toBe(0);
    });

    it("should return 1 for one level up", () => {
      expect(calculateRelativeDepth("../utils")).toBe(1);
    });

    it("should calculate correct depth for multiple levels", () => {
      expect(calculateRelativeDepth("../../utils")).toBe(2);
      expect(calculateRelativeDepth("../../../utils")).toBe(3);
      expect(calculateRelativeDepth("../../../../utils")).toBe(4);
      expect(calculateRelativeDepth("../../../../../components/ellipsis-container")).toBe(5);
    });

    it("should handle paths with multiple segments", () => {
      expect(calculateRelativeDepth("../../../src/utils/helper")).toBe(3);
      expect(calculateRelativeDepth("../../components/ui/button")).toBe(2);
    });
  });

  describe("shouldTransform", () => {
    it("should return false if depth is within maxRelativePathDepth", () => {
      expect(shouldTransform("./utils", 1)).toBe(false);
      expect(shouldTransform("../components", 1)).toBe(false);
      expect(shouldTransform("../utils", 2)).toBe(false);
    });

    it("should return true if depth exceeds maxRelativePathDepth", () => {
      expect(shouldTransform("../../utils", 1)).toBe(true);
      expect(shouldTransform("../../../components", 1)).toBe(true);
      expect(shouldTransform("../../../../../components/ellipsis-container", 1)).toBe(true);
    });

    it("should respect different maxRelativePathDepth values", () => {
      expect(shouldTransform("../../utils", 2)).toBe(false);
      expect(shouldTransform("../../utils", 1)).toBe(true);
      expect(shouldTransform("../../../utils", 2)).toBe(true);
    });
  });

  describe("transformText", () => {
    const testFilePath = "D:\\W\\Upriver\\webapp-next\\app\\[lang]\\(app)\\(no-header)\\agent\\task-list-item.tsx";
    const projectRoot = "D:\\W\\Upriver\\webapp-next";

    beforeEach(() => {
      // Setup default mocks
      pathResolver.findProjectRoot.mockReturnValue(projectRoot);
      pathResolver.detectNextJs.mockReturnValue(true);
      pathResolver.findConfigFile.mockReturnValue({
        path: `${projectRoot}\\tsconfig.json`,
        type: "tsconfig",
      });
      pathResolver.loadConfig.mockReturnValue({
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "@/*": ["./*"],
          },
        },
      });
    });

    it("should transform deep relative import to absolute import", () => {
      const sourceCode = `import { EllipsisContainer } from "../../../../../components/ellipsis-container/ellipsis-container";`;
      
      pathResolver.resolveRelativePath.mockReturnValue(
        "D:\\W\\Upriver\\webapp-next\\components\\ellipsis-container\\ellipsis-container.tsx"
      );
      pathResolver.convertToAbsolutePath.mockReturnValue(
        "@/components/ellipsis-container/ellipsis-container"
      );

      const result = transformText(sourceCode, testFilePath);

      expect(result).toBe(
        `import { EllipsisContainer } from "@/components/ellipsis-container/ellipsis-container";`
      );
      expect(pathResolver.resolveRelativePath).toHaveBeenCalledWith(
        "../../../../../components/ellipsis-container/ellipsis-container",
        testFilePath
      );
    });

    it("should not transform shallow relative imports", () => {
      const sourceCode = `import { Utils } from "../utils";`;

      const result = transformText(sourceCode, testFilePath, {
        maxRelativePathDepth: 1,
      });

      expect(result).toBe(sourceCode);
      expect(pathResolver.resolveRelativePath).not.toHaveBeenCalled();
    });

    it("should transform multiple deep imports in the same file", () => {
      const sourceCode = `import { EllipsisContainer } from "../../../../../components/ellipsis-container/ellipsis-container";
import { Button } from "../../../../../components/ui/button";
import { Utils } from "../utils";`;

      pathResolver.resolveRelativePath
        .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\components\\ellipsis-container\\ellipsis-container.tsx")
        .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\components\\ui\\button.tsx");
      
      pathResolver.convertToAbsolutePath
        .mockReturnValueOnce("@/components/ellipsis-container/ellipsis-container")
        .mockReturnValueOnce("@/components/ui/button");

      const result = transformText(sourceCode, testFilePath);

      expect(result).toBe(
        `import { EllipsisContainer } from "@/components/ellipsis-container/ellipsis-container";
import { Button } from "@/components/ui/button";
import { Utils } from "../utils";`
      );
    });

    it("should preserve single quotes if used in original import", () => {
      const sourceCode = `import { EllipsisContainer } from '../../../../../components/ellipsis-container/ellipsis-container';`;
      
      pathResolver.resolveRelativePath.mockReturnValue(
        "D:\\W\\Upriver\\webapp-next\\components\\ellipsis-container\\ellipsis-container.tsx"
      );
      pathResolver.convertToAbsolutePath.mockReturnValue(
        "@/components/ellipsis-container/ellipsis-container"
      );

      const result = transformText(sourceCode, testFilePath);

      expect(result).toBe(
        `import { EllipsisContainer } from '@/components/ellipsis-container/ellipsis-container';`
      );
    });

    it("should handle imports without trailing semicolons", () => {
      const sourceCode = `import { EllipsisContainer } from "../../../../../components/ellipsis-container/ellipsis-container"`;
      
      pathResolver.resolveRelativePath.mockReturnValue(
        "D:\\W\\Upriver\\webapp-next\\components\\ellipsis-container\\ellipsis-container.tsx"
      );
      pathResolver.convertToAbsolutePath.mockReturnValue(
        "@/components/ellipsis-container/ellipsis-container"
      );

      const result = transformText(sourceCode, testFilePath);

      expect(result).toBe(
        `import { EllipsisContainer } from "@/components/ellipsis-container/ellipsis-container"`
      );
    });

    it("should transform various import statement types", () => {
      const sourceCode = `import Component from "../../../../../../lib/component";
import { named } from "../../../../../../lib/named";
import { a, b, c } from "../../../../../../lib/multiple";
import * as All from "../../../../../../lib/all";
import type { Type } from "../../../../../../lib/types";
import type Named from "../../../../../../lib/type-default";`;

      pathResolver.resolveRelativePath.mockImplementation((importPath) => {
        return `${projectRoot}\\lib\\${importPath.split("/").pop()}`;
      });
      
      pathResolver.convertToAbsolutePath.mockImplementation((resolved) => {
        const name = resolved.split("\\").pop();
        return `@/lib/${name}`;
      });

      const result = transformText(sourceCode, testFilePath);

      expect(result).toContain('import Component from "@/lib/component"');
      expect(result).toContain('import { named } from "@/lib/named"');
      expect(result).toContain('import { a, b, c } from "@/lib/multiple"');
      expect(result).toContain('import * as All from "@/lib/all"');
      expect(result).toContain('import type { Type } from "@/lib/types"');
      expect(result).toContain('import type Named from "@/lib/type-default"');
    });

    it("should transform require() statements", () => {
      const sourceCode = `const utils = require("../../../../../utils/helper");`;
      
      pathResolver.resolveRelativePath.mockReturnValue(
        "D:\\W\\Upriver\\webapp-next\\utils\\helper.js"
      );
      pathResolver.convertToAbsolutePath.mockReturnValue("@/utils/helper");

      const result = transformText(sourceCode, testFilePath);

      expect(result).toBe(`const utils = require("@/utils/helper");`);
    });

    it("should preserve require() with single quotes", () => {
      const sourceCode = `const utils = require('../../../../../utils/helper');`;
      
      pathResolver.resolveRelativePath.mockReturnValue(
        "D:\\W\\Upriver\\webapp-next\\utils\\helper.js"
      );
      pathResolver.convertToAbsolutePath.mockReturnValue("@/utils/helper");

      const result = transformText(sourceCode, testFilePath);

      expect(result).toBe(`const utils = require('@/utils/helper');`);
    });

    it("should handle custom absolutePathPrefix", () => {
      const sourceCode = `import { Component } from "../../../../../components/test";`;
      
      pathResolver.resolveRelativePath.mockReturnValue(
        "D:\\W\\Upriver\\webapp-next\\components\\test.tsx"
      );
      pathResolver.convertToAbsolutePath.mockReturnValue("~/components/test");

      const result = transformText(sourceCode, testFilePath, {
        absolutePathPrefix: "~/",
      });

      expect(pathResolver.convertToAbsolutePath).toHaveBeenCalledWith(
        expect.any(String),
        projectRoot,
        expect.any(Object),
        "~/",
        true
      );
    });

    it("should handle custom maxRelativePathDepth", () => {
      const sourceCode = `import { A } from "../../a";
import { B } from "../../../b";`;

      pathResolver.resolveRelativePath.mockReturnValue(
        "D:\\W\\Upriver\\webapp-next\\b.tsx"
      );
      pathResolver.convertToAbsolutePath.mockReturnValue("@/b");

      const result = transformText(sourceCode, testFilePath, {
        maxRelativePathDepth: 2,
      });

      // Only the third level (../../../) should be transformed
      expect(result).toContain('from "../../a"');
      expect(result).toContain('from "@/b"');
    });

    it("should handle transformation errors gracefully", () => {
      const sourceCode = `import { Component } from "../../../../../components/test";`;
      
      pathResolver.resolveRelativePath.mockImplementation(() => {
        throw new Error("Path resolution failed");
      });

      const result = transformText(sourceCode, testFilePath);

      // Should return original code if transformation fails
      expect(result).toBe(sourceCode);
    });

    it("should not transform non-relative imports", () => {
      const sourceCode = `import React from "react";
import { Button } from "@/components/button";
import lodash from "lodash";`;

      const result = transformText(sourceCode, testFilePath);

      expect(result).toBe(sourceCode);
      expect(pathResolver.resolveRelativePath).not.toHaveBeenCalled();
    });

    it("should handle mixed import and require statements", () => {
      const sourceCode = `import { A } from "../../../../../lib/a";
const b = require("../../../../../lib/b");
import { C } from "../c";`;

      pathResolver.resolveRelativePath
        .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\lib\\a.js")
        .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\lib\\b.js");
      
      pathResolver.convertToAbsolutePath
        .mockReturnValueOnce("@/lib/a")
        .mockReturnValueOnce("@/lib/b");

      const result = transformText(sourceCode, testFilePath);

      expect(result).toContain('from "@/lib/a"');
      expect(result).toContain('require("@/lib/b")');
      expect(result).toContain('from "../c"'); // Not transformed
    });

    it("should handle explicit nextjsMode option", () => {
      const sourceCode = `import { Component } from "../../../../../components/test";`;
      
      pathResolver.resolveRelativePath.mockReturnValue(
        "D:\\W\\Upriver\\webapp-next\\components\\test.tsx"
      );
      pathResolver.convertToAbsolutePath.mockReturnValue("@/components/test");
      pathResolver.detectNextJs.mockReturnValue(false);

      // Explicitly set nextjsMode to true
      transformText(sourceCode, testFilePath, {
        nextjsMode: true,
      });

      expect(pathResolver.convertToAbsolutePath).toHaveBeenCalledWith(
        expect.any(String),
        projectRoot,
        expect.any(Object),
        "@/",
        true // Should be true because we explicitly set it
      );
    });

    it("should use custom tsconfigPath option", () => {
      const customTsconfigPath = "D:\\W\\Upriver\\webapp-next\\custom-tsconfig.json";
      const sourceCode = `import { Component } from "../../../../../components/test";`;
      
      pathResolver.resolveRelativePath.mockReturnValue(
        "D:\\W\\Upriver\\webapp-next\\components\\test.tsx"
      );
      pathResolver.convertToAbsolutePath.mockReturnValue("@/components/test");
      pathResolver.loadConfig.mockReturnValue({
        compilerOptions: {
          baseUrl: ".",
          paths: { "@/*": ["./*"] },
        },
      });

      transformText(sourceCode, testFilePath, {
        tsconfigPath: customTsconfigPath,
      });

      expect(pathResolver.loadConfig).toHaveBeenCalledWith(customTsconfigPath);
    });

    it("should handle real-world complex file with multiple imports", () => {
      const sourceCode = `import React from "react";
import { EllipsisContainer } from "../../../../../components/ellipsis-container/ellipsis-container";
import { Button } from "../../../../../components/ui/button";
import { Card } from "../../../../../components/ui/card";
import { useRouter } from "next/navigation";
import { TaskStatus } from "../../../../../types/task";
import { formatDate } from "../utils";

export function TaskListItem() {
  return <div>Task</div>;
}`;

      pathResolver.resolveRelativePath
        .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\components\\ellipsis-container\\ellipsis-container.tsx")
        .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\components\\ui\\button.tsx")
        .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\components\\ui\\card.tsx")
        .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\types\\task.ts");
      
      pathResolver.convertToAbsolutePath
        .mockReturnValueOnce("@/components/ellipsis-container/ellipsis-container")
        .mockReturnValueOnce("@/components/ui/button")
        .mockReturnValueOnce("@/components/ui/card")
        .mockReturnValueOnce("@/types/task");

      const result = transformText(sourceCode, testFilePath);

      expect(result).toContain('import React from "react"');
      expect(result).toContain('import { EllipsisContainer } from "@/components/ellipsis-container/ellipsis-container"');
      expect(result).toContain('import { Button } from "@/components/ui/button"');
      expect(result).toContain('import { Card } from "@/components/ui/card"');
      expect(result).toContain('import { useRouter } from "next/navigation"');
      expect(result).toContain('import { TaskStatus } from "@/types/task"');
      expect(result).toContain('import { formatDate } from "../utils"');
      expect(result).toContain('export function TaskListItem()');
    });
  });
});

