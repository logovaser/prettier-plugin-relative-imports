module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.test.js"],
  coverageDirectory: "coverage",
  collectCoverageFrom: ["lib/**/*.js", "!lib/**/*.test.js"],
  verbose: true,
};

