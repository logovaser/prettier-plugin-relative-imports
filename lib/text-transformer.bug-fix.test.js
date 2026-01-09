/**
 * Tests for the bug fix: ensuring transformText only transforms actual import statements
 * and does NOT transform import-like strings in code, JSX, comments, or template literals
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
  convertToAbsolutePath: jest.fn((absolutePath) => {
    // Simulate conversion
    return "@/components/test";
  }),
  resolveRelativePath: jest.fn(() => {
    return "D:\\W\\Upriver\\webapp-next\\components\\test.tsx";
  }),
}));

describe("text-transformer bug fix - only transform actual imports", () => {
  const testFilePath =
    "D:\\W\\Upriver\\webapp-next\\app\\[lang]\\(app)\\(no-header)\\agent\\task-list-item.tsx";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("should NOT transform import-like strings in code", () => {
    it("should not transform import strings in JSX content", () => {
      const sourceCode = `import React from "react";
import { Button } from "../../../../../components/button";

export function Component() {
  return (
    <div>
      <p>To use this, add: import Button from "../../../../../components/button"</p>
      <p>Or use require("../../../../../lib/helper")</p>
    </div>
  );
}`;

      const pathResolver = require("./path-resolver");
      pathResolver.resolveRelativePath.mockReturnValue(
        "D:\\W\\Upriver\\webapp-next\\components\\button.tsx"
      );
      pathResolver.convertToAbsolutePath.mockReturnValue("@/components/button");

      const result = transformText(sourceCode, testFilePath);

      // The actual import should be transformed
      expect(result).toContain('import { Button } from "@/components/button"');

      // But the strings in JSX should NOT be transformed
      expect(result).toContain('import Button from "../../../../../components/button"');
      expect(result).toContain('require("../../../../../lib/helper")');
    });

    it("should not transform import strings in template literals", () => {
      const sourceCode = `import { Component } from "../../../../../components/test";

const message = \`
  Add this import:
  import { Component } from "../../../../../components/test"
\`;

const code = \`require("../../../../../lib/utils")\`;`;

      const pathResolver = require("./path-resolver");
      pathResolver.resolveRelativePath.mockReturnValue(
        "D:\\W\\Upriver\\webapp-next\\components\\test.tsx"
      );
      pathResolver.convertToAbsolutePath.mockReturnValue("@/components/test");

      const result = transformText(sourceCode, testFilePath);

      // The actual import should be transformed
      expect(result).toContain('import { Component } from "@/components/test"');

      // But the template literals should still have the deep paths (not transformed)
      expect(result).toContain('import { Component } from "../../../../../components/test"');
      expect(result).toContain('require("../../../../../lib/utils")');
      
      // The strings in code should be preserved
      const linesWithDeepPaths = result.split('\n').filter(line => 
        line.includes('../../../../../') && !line.trim().startsWith('import')
      );
      expect(linesWithDeepPaths.length).toBeGreaterThan(0);
    });

    it("should not transform import strings in regular string literals", () => {
      const sourceCode = `import { Utils } from "../../../../../lib/utils";

const instructionText = "You should import { Utils } from '../../../../../lib/utils'";
const requireText = 'Use require("../../../../../config/settings")';`;

      const pathResolver = require("./path-resolver");
      pathResolver.resolveRelativePath.mockReturnValue(
        "D:\\W\\Upriver\\webapp-next\\lib\\utils.tsx"
      );
      pathResolver.convertToAbsolutePath.mockReturnValue("@/lib/utils");

      const result = transformText(sourceCode, testFilePath);

      // The actual import should be transformed
      expect(result).toContain('import { Utils } from "@/lib/utils"');

      // But string literals should NOT be transformed
      expect(result).toContain("import { Utils } from '../../../../../lib/utils'");
      expect(result).toContain('require("../../../../../config/settings")');
    });

    it("should not transform import strings in comments", () => {
      const sourceCode = `// TODO: import { Button } from "../../../../../components/button"
/* 
 * Old code: import { Card } from "../../../../../components/card"
 * Use require("../../../../../lib/old")
 */
import { Component } from "../../../../../components/test";`;

      const pathResolver = require("./path-resolver");
      pathResolver.resolveRelativePath.mockReturnValue(
        "D:\\W\\Upriver\\webapp-next\\components\\test.tsx"
      );
      pathResolver.convertToAbsolutePath.mockReturnValue("@/components/test");

      const result = transformText(sourceCode, testFilePath);

      // The actual import should be transformed
      expect(result).toContain('import { Component } from "@/components/test"');

      // But comments should NOT be transformed
      expect(result).toContain('// TODO: import { Button } from "../../../../../components/button"');
      expect(result).toContain('* Old code: import { Card } from "../../../../../components/card"');
      expect(result).toContain('* Use require("../../../../../lib/old")');
    });
  });

  describe("should STILL transform actual import statements", () => {
    it("should transform actual import statements at the start of lines", () => {
      const sourceCode = `import React from "react";
import { Component } from "../../../../../components/test";
  import { Utils } from "../../../../../lib/utils";
    import { Config } from "../../../../../config/app";`;

      const pathResolver = require("./path-resolver");
      pathResolver.resolveRelativePath
        .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\components\\test.tsx")
        .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\lib\\utils.ts")
        .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\config\\app.ts");

      pathResolver.convertToAbsolutePath
        .mockReturnValueOnce("@/components/test")
        .mockReturnValueOnce("@/lib/utils")
        .mockReturnValueOnce("@/config/app");

      const result = transformText(sourceCode, testFilePath);

      expect(result).toContain('import { Component } from "@/components/test"');
      expect(result).toContain('import { Utils } from "@/lib/utils"');
      expect(result).toContain('import { Config } from "@/config/app"');
      expect(result).toContain('import React from "react"'); // Not transformed (external)
    });

    it("should preserve indentation when transforming imports", () => {
      const sourceCode = `  import { Component } from "../../../../../components/test";
    import { Utils } from "../../../../../lib/utils";`;

      const pathResolver = require("./path-resolver");
      pathResolver.resolveRelativePath
        .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\components\\test.tsx")
        .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\lib\\utils.ts");

      pathResolver.convertToAbsolutePath
        .mockReturnValueOnce("@/components/test")
        .mockReturnValueOnce("@/lib/utils");

      const result = transformText(sourceCode, testFilePath);

      // Check that indentation is preserved
      expect(result).toContain('  import { Component } from "@/components/test"');
      expect(result).toContain('    import { Utils } from "@/lib/utils"');
    });
  });

  describe("should handle require() statements correctly", () => {
    it("should transform require at the start of a line with const/let/var", () => {
      const sourceCode = `const utils = require("../../../../../lib/utils");
let config = require("../../../../../config/app");
var helper = require("../../../../../lib/helper");`;

      const pathResolver = require("./path-resolver");
      pathResolver.resolveRelativePath
        .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\lib\\utils.js")
        .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\config\\app.js")
        .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\lib\\helper.js");

      pathResolver.convertToAbsolutePath
        .mockReturnValueOnce("@/lib/utils")
        .mockReturnValueOnce("@/config/app")
        .mockReturnValueOnce("@/lib/helper");

      const result = transformText(sourceCode, testFilePath);

      expect(result).toContain('const utils = require("@/lib/utils")');
      expect(result).toContain('let config = require("@/config/app")');
      expect(result).toContain('var helper = require("@/lib/helper")');
    });

    it("should not transform require in conditional statements or nested code", () => {
      const sourceCode = `const utils = require("../../../../../lib/utils");

function loadModule() {
  if (condition) {
    const lazy = require("../../../../../lib/lazy");
  }
  return something || require("../../../../../lib/fallback");
}`;

      const pathResolver = require("./path-resolver");
      pathResolver.resolveRelativePath.mockReturnValueOnce(
        "D:\\W\\Upriver\\webapp-next\\lib\\utils.js"
      );
      pathResolver.convertToAbsolutePath.mockReturnValueOnce("@/lib/utils");

      const result = transformText(sourceCode, testFilePath);

      // First require (in imports section) should be transformed
      expect(result).toContain('const utils = require("@/lib/utils")');

      // But requires inside function (outside imports section) should NOT be transformed
      expect(result).toContain('const lazy = require("../../../../../lib/lazy")');
      expect(result).toContain('return something || require("../../../../../lib/fallback")');
    });
  });

  describe("real-world complete file test", () => {
    it("should correctly transform a complete React component file", () => {
      const sourceCode = `import React from "react";
import { EllipsisContainer } from "../../../../../components/ellipsis-container/ellipsis-container";
import { Card } from "../../../../../components/ui/card";
import { Badge } from "../../../../../components/ui/badge";
import { useRouter } from "next/navigation";
import { LocalUtils } from "./utils";

interface TaskListItemProps {
  title: string;
  status: string;
  description: string;
}

/**
 * TaskListItem component
 * 
 * Usage:
 * import { TaskListItem } from "../../../../../components/task-list-item"
 */
export function TaskListItem({ title, status, description }: TaskListItemProps) {
  const instructionText = "To use, import { TaskListItem } from '../../../../../components/task-list-item'";
  
  return (
    <Card>
      <EllipsisContainer>
        <h3>{title}</h3>
        <Badge>{status}</Badge>
        <p>{description}</p>
        {/* TODO: import { Icon } from "../../../../../components/icon" */}
        <div className="help-text">
          Add this: require("../../../../../lib/config")
        </div>
      </EllipsisContainer>
    </Card>
  );
}`;

      const pathResolver = require("./path-resolver");
      pathResolver.resolveRelativePath
        .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\components\\ellipsis-container\\ellipsis-container.tsx")
        .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\components\\ui\\card.tsx")
        .mockReturnValueOnce("D:\\W\\Upriver\\webapp-next\\components\\ui\\badge.tsx");

      pathResolver.convertToAbsolutePath
        .mockReturnValueOnce("@/components/ellipsis-container/ellipsis-container")
        .mockReturnValueOnce("@/components/ui/card")
        .mockReturnValueOnce("@/components/ui/badge");

      const result = transformText(sourceCode, testFilePath);

      // Verify actual imports are transformed
      expect(result).toContain('import { EllipsisContainer } from "@/components/ellipsis-container/ellipsis-container"');
      expect(result).toContain('import { Card } from "@/components/ui/card"');
      expect(result).toContain('import { Badge } from "@/components/ui/badge"');

      // Verify shallow and external imports are NOT transformed
      expect(result).toContain('import React from "react"');
      expect(result).toContain('import { useRouter } from "next/navigation"');
      expect(result).toContain('import { LocalUtils } from "./utils"');

      // Verify strings in comments and JSX are NOT transformed
      expect(result).toContain('import { TaskListItem } from "../../../../../components/task-list-item"');
      expect(result).toContain("import { TaskListItem } from '../../../../../components/task-list-item'");
      expect(result).toContain('{/* TODO: import { Icon } from "../../../../../components/icon" */}');
      expect(result).toContain('require("../../../../../lib/config")');

      // Verify the code structure is preserved
      expect(result).toContain('export function TaskListItem');
      expect(result).toContain('<Card>');
      expect(result).toContain('<EllipsisContainer>');
      expect(result).toContain('interface TaskListItemProps');
    });
  });
});

