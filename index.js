const { createParser } = require("./lib/parser");

// Lazy load Prettier parsers to avoid issues when prettier isn't installed in plugin's node_modules
function getParser(moduleName, parserName) {
  try {
    const parserModule = require(`prettier/parser-${moduleName}`);
    // Parser modules export { parsers: { parserName: {...} } }
    if (parserModule.parsers && parserModule.parsers[parserName]) {
      return parserModule.parsers[parserName];
    }
    // Fallback: maybe it's exported directly
    return parserModule[parserName] || parserModule;
  } catch (e) {
    throw new Error(`Could not load parser: ${parserName}. Make sure prettier is installed.`);
  }
}

module.exports = {
  parsers: {
    get babel() {
      return createParser(getParser("babel", "babel"), "babel", "babel");
    },
    get "babel-ts"() {
      return createParser(getParser("babel", "babel-ts"), "babel", "babel-ts");
    },
    get typescript() {
      return createParser(getParser("typescript", "typescript"), "typescript", "typescript");
    },
    get vue() {
      return createParser(getParser("vue", "vue"), "vue", "vue");
    },
  },
  options: {
    absolutePathPrefix: {
      type: "string",
      category: "Global",
      default: "@/",
      description: "Prefix for absolute import paths (e.g., '@/')",
    },
    maxRelativePathDepth: {
      type: "int",
      category: "Global",
      default: 1,
      description: "Maximum depth of relative paths before converting to absolute (e.g., 1 means '../' and './' are preserved)",
    },
    tsconfigPath: {
      type: "string",
      category: "Global",
      default: "",
      description: "Path to tsconfig.json or jsconfig.json (auto-detected if not provided)",
    },
    nextjsMode: {
      type: "boolean",
      category: "Global",
      default: false,
      description: "Enable Next.js 14+ specific optimizations (auto-detected if Next.js is present)",
    },
  },
};

