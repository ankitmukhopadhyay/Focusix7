/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  rootDir: __dirname,
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  collectCoverageFrom: ["www/state-helpers.js", "www/native-bridge.js"],
  coveragePathIgnorePatterns: ["/node_modules/", "/android/"],
  testPathIgnorePatterns: ["/node_modules/", "/android/"],
  verbose: true,
};
