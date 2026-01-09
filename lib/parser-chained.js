const { transformText } = require("./text-transformer");

/**
 * Creates a parser wrapper that extends an existing parser
 * This version supports chaining with other plugins like organize-imports
 */
function createParser(originalParser) {
  return {
    ...originalParser,
    parse: (text, parsers, options) => {
      // First, transform import paths in the text before parsing
      let transformedText = text;
      if (options.filepath) {
        transformedText = transformText(text, options.filepath, options);
      }

      // Check if there's a parser in the parsers object that might be from another plugin
      // This allows chaining with plugins like organize-imports
      const parserToUse = parsers?.[originalParser.astFormat] || originalParser;
      
      // Use the (possibly wrapped) parser to parse the transformed code
      return parserToUse.parse(transformedText, parsers, options);
    },
    // Ensure astFormat is preserved
    astFormat: originalParser.astFormat || originalParser.name,
  };
}

module.exports = {
  createParser,
};

