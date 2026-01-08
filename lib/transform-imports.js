const {
  detectNextJs,
  findProjectRoot,
  loadConfig,
  findConfigFile,
  convertToAbsolutePath,
  resolveRelativePath,
} = require("./path-resolver");

/**
 * Calculates the depth of a relative path (number of ../ segments)
 */
function calculateRelativeDepth(importPath) {
  if (!importPath.startsWith(".")) {
    return 0; // Not a relative path
  }

  const parts = importPath.split("/");
  let depth = 0;

  for (const part of parts) {
    if (part === "..") {
      depth++;
    } else if (part === ".") {
      // Current directory, doesn't add depth
    } else {
      break; // Reached the actual path
    }
  }

  return depth;
}

/**
 * Checks if an import path should be transformed
 */
function shouldTransform(importPath, maxRelativePathDepth) {
  const depth = calculateRelativeDepth(importPath);
  return depth > maxRelativePathDepth;
}

/**
 * Transforms import statements in the AST
 */
function transformImports(ast, filePath, options = {}) {
  const {
    absolutePathPrefix = "@/",
    maxRelativePathDepth = 1,
    tsconfigPath,
    nextjsMode,
  } = options;

  // Find project root
  const projectRoot = findProjectRoot(filePath);

  // Detect Next.js if not explicitly set
  const isNextJs =
    nextjsMode !== undefined
      ? nextjsMode
      : detectNextJs(projectRoot);

  // Load config
  let config = null;
  if (tsconfigPath) {
    config = loadConfig(tsconfigPath);
  } else {
    const configFile = findConfigFile(projectRoot);
    if (configFile) {
      config = loadConfig(configFile.path);
    }
  }

  // Traverse AST and transform imports
  function traverse(node) {
    if (!node || typeof node !== "object") {
      return;
    }

    // Handle import declarations
    if (node.type === "ImportDeclaration" && node.source) {
      const importPath = node.source.value;

      if (shouldTransform(importPath, maxRelativePathDepth)) {
        try {
          // Resolve relative path to absolute file path
          const resolvedPath = resolveRelativePath(importPath, filePath);

          // Convert to absolute import path
          const absoluteImportPath = convertToAbsolutePath(
            resolvedPath,
            projectRoot,
            config,
            absolutePathPrefix,
            isNextJs
          );

          // Update the import source
          if (absoluteImportPath) {
            node.source.value = absoluteImportPath;
          }
        } catch (e) {
          // If transformation fails, keep original path
          console.warn(`Failed to transform import: ${importPath}`, e.message);
        }
      }
    }

    // Handle require() calls
    if (
      node.type === "CallExpression" &&
      node.callee &&
      node.callee.type === "Identifier" &&
      node.callee.name === "require" &&
      node.arguments &&
      node.arguments[0] &&
      node.arguments[0].type === "StringLiteral"
    ) {
      const importPath = node.arguments[0].value;

      if (shouldTransform(importPath, maxRelativePathDepth)) {
        try {
          const resolvedPath = resolveRelativePath(importPath, filePath);
          const absoluteImportPath = convertToAbsolutePath(
            resolvedPath,
            projectRoot,
            config,
            absolutePathPrefix,
            isNextJs
          );

          if (absoluteImportPath) {
            node.arguments[0].value = absoluteImportPath;
          }
        } catch (e) {
          console.warn(`Failed to transform require: ${importPath}`, e.message);
        }
      }
    }

    // Recursively traverse children
    for (const key in node) {
      if (key === "parent" || key === "leadingComments" || key === "trailingComments") {
        continue;
      }

      const value = node[key];
      if (Array.isArray(value)) {
        value.forEach(traverse);
      } else if (value && typeof value === "object") {
        traverse(value);
      }
    }
  }

  traverse(ast);
  return ast;
}

module.exports = {
  calculateRelativeDepth,
  shouldTransform,
  transformImports,
};

