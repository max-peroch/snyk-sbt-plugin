import * as path from 'path';
import * as plugin from '../../lib';

// sbt 2 requires Java 17+, so these tests live in their own file and run under
// `npm run test:sbt2` (jest.config.sbt2.ts) instead of the default `npm test`,
// which is also exercised on Java 8 and 11.
const fixtureDir = path.join(__dirname, '..', 'fixtures');

test('Run inspect() on sbt v.2.0.9', async () => {
  const result: any = await plugin.inspect(
    fixtureDir,
    'testproj-2.0.0/build.sbt',
    {},
  );

  expect(result.plugin.name).toBe('bundled:sbt');
  expect(result.package.packageFormatVersion).toBe('mvn:0.0.1');
  expect(result.package.version).toBe('0.1.0-SNAPSHOT');
  expect(result.package.name).toBe('com.example:sbt2-app_3');
  expect(result.package.dependencies['com.google.code.gson:gson'].version).toBe(
    '2.6.2',
  );
  expect(
    result.package.dependencies['org.playframework:play-json_3'].dependencies[
      'com.fasterxml.jackson.core:jackson-databind'
    ].version,
  ).toBe('2.15.2');
});
