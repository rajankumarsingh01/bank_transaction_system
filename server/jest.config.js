module.exports = {
    testEnvironment: "node",
    setupFilesAfterEnv: [ "<rootDir>/tests/setup.js" ],
    testMatch: [ "**/tests/**/*.test.js" ],
    verbose: true,
    testTimeout: 30000,
    forceExit: true,
    detectOpenHandles: true,
    coveragePathIgnorePatterns: [ "/node_modules/" ]
};