const { transformText } = require("./text-transformer");

// Cache for base parsers to avoid re-requiring
const baseParserCache = {};

/**
 * Gets the base Prettier parser (before any plugin modifications)
 */
function getBaseParser(moduleName, parserName) {
  const cacheKey = `${moduleName}-${parserName}`;
  if (baseParserCache[cacheKey]) {
    return baseParserCache[cacheKey];
  }

  try {
    const parserModule = require(`prettier/parser-${moduleName}`);
    let baseParser;
    
    if (parserModule.parsers && parserModule.parsers[parserName]) {
      baseParser = parserModule.parsers[parserName];
    } else {
      baseParser = parserModule[parserName] || parserModule;
    }
    
    baseParserCache[cacheKey] = baseParser;
    return baseParser;
  } catch (e) {
    return null;
  }
}

/**
 * Tries to get organize-imports parser if available
 * This allows us to chain with organize-imports when it's loaded before us
 */
function getOrganizeImportsParser(astFormat) {
  try {
    const organizeImports = require('prettier-plugin-organize-imports');
    if (organizeImports && organizeImports.parsers) {
      // organize-imports typically wraps the same parsers we do
      const parserNames = ['typescript', 'babel-ts', 'babel'];
      for (const name of parserNames) {
        if (organizeImports.parsers[name]) {
          const orgParser = organizeImports.parsers[name];
          if (orgParser.astFormat === astFormat) {
            return orgParser;
          }
        }
      }
    }
  } catch (e) {
    // organize-imports not installed or not available
  }
  return null;
}

/**
 * Creates a parser wrapper that extends a Prettier parser
 * 
 * IMPORTANT: To work with prettier-plugin-organize-imports, load this plugin LAST:
 * 
 * ```json
 * {
 *   "plugins": [
 *     "prettier-plugin-organize-imports",
 *     "prettier-plugin-relative-imports"  ← Load LAST
 *   ]
 * }
 * ```
 * 
 * Execution flow when loaded last:
 * 1. Our plugin transforms: ../../../../../path → @/path
 * 2. Our plugin calls the base Prettier parser
 * 3. organize-imports processes the result via its mechanisms
 * 
 * This ensures both transformations happen!
 */
function createParser(originalParser, moduleName, parserName) {
  const astFormat = originalParser.astFormat || originalParser.name;
  
  return {
    ...originalParser,
    parse: (text, parsers, options) => {
      // Step 1: Transform import paths in the text BEFORE parsing
      // This is our main transformation
      let transformedText = text;
      if (options.filepath) {
        transformedText = transformText(text, options.filepath, options);
      }

      // Step 2: Determine which parser to use
      // We want to use the base Prettier parser so that organize-imports
      // can still process the result via its preprocess/postprocess hooks
      const baseParser = getBaseParser(moduleName, parserName) || originalParser;
      
      // Step 3: Parse with the base parser
      // organize-imports should work via preprocess hooks if it uses them,
      // or it will process the AST after parsing
      return baseParser.parse(transformedText, parsers, options);
    },
    // Ensure astFormat is preserved
    astFormat: astFormat,
  };
}

module.exports = {
  createParser,
};

