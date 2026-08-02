import type { Config } from 'jest'

const moduleNameMapper = {
  '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  '^@employees/(.*)$': '<rootDir>/src/employees/$1',
  '^@document-types/(.*)$': '<rootDir>/src/document-types/$1',
  '^@requirements/(.*)$': '<rootDir>/src/requirements/$1',
  '^@stats/(.*)$': '<rootDir>/src/stats/$1',
  '^@app/(.*)$': '<rootDir>/src/$1',
}

const transform = { '^.+\\.(t|j)s$': 'ts-jest' }

const config: Config = {
  rootDir: '.',
  maxWorkers: 1,
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: './coverage',
  projects: [
    {
      displayName: 'unit',
      rootDir: '.',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
      moduleFileExtensions: ['js', 'json', 'ts'],
      transform,
      moduleNameMapper,
    },
    {
      displayName: 'e2e',
      rootDir: '.',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
      moduleFileExtensions: ['js', 'json', 'ts'],
      transform,
      moduleNameMapper,
      globalSetup: '<rootDir>/test/setup/global-setup.ts',
      globalTeardown: '<rootDir>/test/setup/global-teardown.ts',
      testTimeout: 30000,
    },
  ],
}

export default config
