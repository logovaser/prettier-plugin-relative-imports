const { transformText } = require("./text-transformer");

/**
 * Creates a parser wrapper that extends a Prettier parser
 */
function createParser(originalParser) {
  return {
    ...originalParser,
    parse: (text, parsers, options) => {
      // Transform import paths in the text before parsing
      let transformedText = text;
      if (options.filepath) {
        transformedText = transformText(text, options.filepath, options);
      }

      // Use the original parser to parse the transformed code
      return originalParser.parse(transformedText, parsers, options);
    },
    // Ensure astFormat is preserved
    astFormat: originalParser.astFormat || originalParser.name,
  };
}

module.exports = {
  createParser,
};

