'use strict';

/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/test/unit/**/*.test.js'],
      testEnvironment: 'node',
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/test/e2e/**/*.test.js'],
      testEnvironment: 'node',
      // node-gyp-build must NOT be auto-mocked here — e2e tests run against
      // the real compiled native binary (arm64 prebuild in QEMU).
      unmockedModulePathPatterns: ['node-gyp-build'],
      automock: false,
    },
  ],
};
