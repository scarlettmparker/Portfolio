import type { Config } from 'jest';

const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
  },
  transform: {
    "^.+\\.(t|j)s$": ["ts-jest", { isolatedModules: true }],
    "^.+\\.(js|jsx|ts|tsx)$": [
      "babel-jest",
      { configFile: "./babel.testconfig.js" }
    ],
  },
  globals: {
    "NODE_ENV": "test"
  },
  transformIgnorePatterns: [
    "node_modules/(?!(cheerio|wordreference)/)",
    "^.+\\.module\\.(css|sass|scss)$"
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};

export default config;
