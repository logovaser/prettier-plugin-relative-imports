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
function getOrganizeImportsParser(parserName, astFormat) {
  try {
    const organizeImports = require('prettier-plugin-organize-imports');
    if (organizeImports && organizeImports.parsers) {
      // organize-imports typically wraps the same parsers we do
      if (organizeImports.parsers[parserName]) {
        const orgParser = organizeImports.parsers[parserName];
        // Check if it matches our astFormat
        if (orgParser.astFormat === astFormat || !astFormat) {
          return orgParser;
        }
      }
    }
  } catch (e) {
    // organize-imports not installed or not available
  }
  return null;
}

/**
 * Finds the next parser in the chain (from another plugin)
 * When we're loaded last, we need to find the parser from the plugin loaded before us
 */
function findNextParserInChain(parsers, astFormat, parserName, currentParser) {
  // The parsers object contains all registered parsers
  // If organize-imports was loaded before us, it might have registered a parser
  // But since we're last, parsers[astFormat] might be us (circular reference)
  
  // Try to get organize-imports parser directly by matching the parser name
  const organizeParser = getOrganizeImportsParser(parserName, astFormat);
  
  if (organizeParser) {
    return organizeParser;
  }
  
  // Fallback: check if there's a different parser in the parsers object
  // (This shouldn't happen if we're loaded last, but be safe)
  if (parsers && parsers[astFormat] && parsers[astFormat] !== currentParser) {
    return parsers[astFormat];
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
      // This is our main transformation - runs FIRST
      let transformedText = text;
      if (options.filepath) {
        transformedText = transformText(text, options.filepath, options);
      }

      // Step 2: Find the next parser in the chain
      // When we're loaded LAST, we need to find organize-imports' parser
      // (which was loaded before us) and call it with our transformed text
      const nextParser = findNextParserInChain(parsers, astFormat, parserName, originalParser);
      
      // Step 3: Determine which parser to use
      let parserToUse;
      
      if (nextParser) {
        // Found organize-imports (or another plugin) - chain with it
        // This ensures both plugins run sequentially:
        // 1. Our transformation (already done above)
        // 2. organize-imports' processing (via its parser)
        parserToUse = nextParser;
      } else {
        // No other plugin found - use base Prettier parser
        parserToUse = getBaseParser(moduleName, parserName) || originalParser;
      }
      
      // Step 4: Parse with the chosen parser
      // This will run organize-imports' transformations if it's in the chain
      return parserToUse.parse(transformedText, parsers, options);
    },
    // Ensure astFormat is preserved
    astFormat: astFormat,
  };
}

module.exports = {
  createParser,
};

