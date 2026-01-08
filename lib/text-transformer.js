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
 * Transforms import paths in source text
 */
function transformText(text, filePath, options = {}) {
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
    nextjsMode === true
      ? true
      : nextjsMode === false
      ? false
      : detectNextJs(projectRoot);

  // Load config
  let config = null;
  if (tsconfigPath && tsconfigPath.trim()) {
    config = loadConfig(tsconfigPath);
  } else {
    const configFile = findConfigFile(projectRoot);
    if (configFile) {
      config = loadConfig(configFile.path);
    }
  }

  // Regex patterns for import statements
  // Matches: import ... from "path" or import ... from 'path'
  const importPattern = /import\s+(?:(?:(?:\*\s+as\s+\w+)|(?:\{[^}]*\})|(?:\w+)|(?:type\s+\{[^}]*\})|(?:type\s+\w+))\s+from\s+)?["']([^"']+)["'];?/gm;
  
  // Matches: require("path") or require('path')
  const requirePattern = /require\s*\(\s*["']([^"']+)["']\s*\)/g;

  let transformedText = text;

  // Transform import statements
  transformedText = transformedText.replace(importPattern, (match, importPath) => {
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
          // Build the new import statement from scratch to avoid replacement issues
          const quote = match.includes('"') ? '"' : "'";
          const hasTrailingSemicolon = match.trim().endsWith(';');
          const importKeyword = match.substring(0, match.indexOf('from') + 4).trim();
          const newImport = `${importKeyword} ${quote}${absoluteImportPath}${quote}${hasTrailingSemicolon ? ';' : ''}`;
          return newImport;
        }
      } catch (e) {
        // If transformation fails, keep original
        if (process.env.DEBUG) {
          console.warn(`Failed to transform import: ${importPath}`, e.message);
        }
      }
    }
    return match;
  });

  // Transform require() calls
  transformedText = transformedText.replace(requirePattern, (match, importPath) => {
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
          const quote = match.includes('"') ? '"' : "'";
          return match.replace(quote + importPath + quote, quote + absoluteImportPath + quote);
        }
      } catch (e) {
        if (process.env.DEBUG) {
          console.warn(`Failed to transform require: ${importPath}`, e.message);
        }
      }
    }
    return match;
  });

  return transformedText;
}

module.exports = {
  calculateRelativeDepth,
  shouldTransform,
  transformText,
};

