import type { Config } from '@jest/types';
import baseConfig from './jest.config';

export default async (): Promise<Config.InitialOptions> => {
  return {
    ...(await baseConfig()),
    testPathIgnorePatterns: ['/node_modules/'],
    testMatch: ['<rootDir>/test/system/sbt2.test.ts'],
  };
};
