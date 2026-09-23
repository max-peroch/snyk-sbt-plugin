import type { Config } from '@jest/types';

export default async (): Promise<Config.InitialOptions> => {
  return {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: false,
    collectCoverageFrom: ['lib/**/*.ts'],
    coverageReporters: ['text-summary', 'html'],
    reporters: ['default', 'jest-junit'],
    testResultsProcessor: 'jest-junit',
    testTimeout: 300000, // 5 minutes
    // sbt 2 needs Java 17+; this suite also runs on Java 8 and 11.
    testPathIgnorePatterns: ['/node_modules/', '/test/system/sbt2\\.test\\.ts$'],
  };
};
