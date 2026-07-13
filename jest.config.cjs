/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  clearMocks: true,
  maxWorkers: 1,
  forceExit: true,

  // Load .env before any test file runs
  // This ensures process.env has JWT_SECRET before test-auth.ts reads it
  setupFiles: ["<rootDir>/src/middlewares/__tests__/helpers/jest.env-setup.ts"],

  globalTeardown: "<rootDir>/src/middlewares/__tests__/helpers/jest.teardown.ts",

  collectCoverageFrom: [
    "src/services/**/*.ts",
    "src/middlewares/**/*.ts",
    "!src/services/email.ts",
  ],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        diagnostics: false,
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
};