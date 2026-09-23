import * as fs from 'fs';
import * as path from 'path';
import * as parser from '../../lib/parse-sbt';
import { DepTree } from '../../lib/types';

function flatten(dependencies: DepTree): string[] {
  const acc = new Set<string>();
  function rec(deps: DepTree): void {
    acc.add(deps.name);
    Object.keys(deps.dependencies || {}).forEach((key) => {
      if (deps.dependencies) {
        rec(deps.dependencies[key]);
      }
    });
  }
  rec(dependencies);
  return Array.from(acc);
}

test('parse `sbt dependencies` output: multi configuration', async () => {
  const sbtOutput = fs
    .readFileSync(
      path.join(__dirname, '..', 'fixtures', 'sbt-dependency-output.txt'),
      'utf8',
    )
    .split('\n');
  const depTree = parser.parse(sbtOutput, 'testApp', '1.0.1', false);

  expect(depTree.name).toBe('testApp');
  expect(depTree.version).toBe('1.0.1');
  expect(depTree.multiBuild).toBeTruthy;
  expect(
    depTree.dependencies!['myproject-common:myproject-common_2.11'].version,
  ).toBe('0.0.1');
  expect(
    depTree.dependencies!['myproject-api:myproject-api_2.11'].dependencies![
      'org.slf4j:slf4j-nop'
    ].version,
  ).toBe('1.6.4');
  expect(
    depTree.dependencies!['myproject-spark:myproject-spark_2.11'].dependencies![
      'org.apache.spark:spark-core_2.11'
    ].dependencies!['org.apache.curator:curator-recipes'].dependencies![
      'org.apache.zookeeper:zookeeper'
    ].dependencies!['org.slf4j:slf4j-log4j12'].version,
  ).toBe('1.7.10');

  const depSet = flatten(depTree);
  expect(depSet.some((dep) => dep.includes('scala-library'))).toBeFalsy;
});

test('parse `sbt dependencies` output: single configuration', async () => {
  const sbtOutput = fs
    .readFileSync(
      path.join(
        __dirname,
        '..',
        'fixtures',
        'sbt-single-config-dependency-output.txt',
      ),
      'utf8',
    )
    .split('\n');

  const depTree = parser.parse(sbtOutput, 'unused', 'unused', false);

  expect(depTree.name).toBe(
    'my-recommendation-spark-engine:my-recommendation-spark-engine_2.10',
  );
  expect(depTree.version).toBe('1.0-SNAPSHOT');
  expect(depTree.multiBuild).toBeUndefined;
  expect(depTree.dependencies!['com.google.code.gson:gson'].version).toBe(
    '2.6.2',
  );
  expect(
    depTree.dependencies!['com.stratio.datasource:spark-mongodb_2.10'].version,
  ).toBe('0.11.1');
  expect(
    depTree.dependencies!['com.stratio.datasource:spark-mongodb_2.10']
      .dependencies!['org.mongodb:casbah-commons_2.10'].version,
  ).toBe('2.8.0');
  expect(
    depTree.dependencies!['com.stratio.datasource:spark-mongodb_2.10']
      .dependencies!['org.mongodb:casbah-commons_2.10'].dependencies![
      'com.github.nscala-time:nscala-time_2.10'
    ].version,
  ).toBe('1.0.0');
  expect(
    depTree.dependencies!['com.stratio.datasource:spark-mongodb_2.10']
      .dependencies!['org.mongodb:casbah-commons_2.10'].dependencies![
      'com.github.nscala-time:nscala-time_2.10'
    ].dependencies!['joda-time:joda-time'].version,
  ).toBe('2.5');
});

function readSbt2Output(): string[] {
  return fs
    .readFileSync(
      path.join(__dirname, '..', 'fixtures', 'sbt-2-dependency-output.txt'),
      'utf8',
    )
    .split('\n');
}

test('parse `sbt dependencyTree` output: sbt 2 without [info] prefixes', async () => {
  const depTree = parser.parse(readSbt2Output(), 'unused', 'unused', false);

  expect(depTree.name).toBe('com.example:sbt2-app_3');
  expect(depTree.version).toBe('0.1.0-SNAPSHOT');
  expect(depTree.multiBuild).toBeUndefined();

  // the startup banner, `loading ...` lines and `[success]` line carry no
  // coordinates, so the root has exactly the four declared/transitive top-level
  // dependencies
  expect(Object.keys(depTree.dependencies!).sort()).toEqual([
    'com.fasterxml.jackson.core:jackson-databind',
    'com.google.code.gson:gson',
    'org.playframework:play-json_3',
    'org.scala-lang:scala3-library_3',
  ]);

  expect(depTree.dependencies!['com.google.code.gson:gson'].version).toBe(
    '2.6.2',
  );
  expect(depTree.dependencies!['org.scala-lang:scala3-library_3'].version).toBe(
    '3.3.3',
  );

  const playJson = depTree.dependencies!['org.playframework:play-json_3'];
  expect(playJson.version).toBe('3.0.4');
  expect(
    playJson.dependencies!['org.playframework:play-functional_3'].dependencies![
      'org.scala-lang:scala3-library_3'
    ].version,
  ).toBe('3.3.3');

  // evicted 2.14.3 lines are dropped, the resolved 2.15.2 ones are kept
  expect(
    playJson.dependencies!['com.fasterxml.jackson.core:jackson-core'].version,
  ).toBe('2.15.2');
  expect(
    playJson.dependencies!['com.fasterxml.jackson.core:jackson-annotations']
      .version,
  ).toBe('2.15.2');
  const jacksonDatabind =
    depTree.dependencies!['com.fasterxml.jackson.core:jackson-databind'];
  expect(Object.keys(jacksonDatabind.dependencies!).sort()).toEqual([
    'com.fasterxml.jackson.core:jackson-annotations',
    'com.fasterxml.jackson.core:jackson-core',
  ]);
  expect(
    jacksonDatabind.dependencies![
      'com.fasterxml.jackson.core:jackson-annotations'
    ].version,
  ).toBe('2.15.2');
  expect(
    jacksonDatabind.dependencies!['com.fasterxml.jackson.core:jackson-core']
      .version,
  ).toBe('2.15.2');
});

test('parse `sbt dependencyTree` output: sbt 2 ignores coordinates logged at other levels', async () => {
  // not produced by sbt itself: injected here to prove a coordinate logged at a
  // level other than [info] is never ingested as a dependency
  const sbtOutput = readSbt2Output().concat(
    '[warn] not-a-dependency:fake-artifact:9.9.9',
  );

  const depTree = parser.parse(sbtOutput, 'unused', 'unused', false);

  expect(flatten(depTree)).not.toContain('not-a-dependency:fake-artifact');
});

test('parse `sbt dependencies` output: plugin 1.2.8', async () => {
  const sbtOutput = fs
    .readFileSync(
      path.join(__dirname, '..', 'fixtures', 'sbt-plugin-1.2.8-output.txt'),
      'utf8',
    )
    .split('\n');
  const depTree = parser.parseSbtPluginResults(
    sbtOutput,
    'com.example:hello_2.12',
    '1.0.0',
  );

  expect(depTree.name).toBe('com.example:hello_2.12');
  expect(depTree.version).toBe('0.1.0-SNAPSHOT');
  expect(
    depTree.dependencies!['axis:axis'].dependencies!['axis:axis-saaj']
      .dependencies!['org.apache.axis:axis-saaj'].version,
  ).toBe('1.4');
  expect(
    depTree.dependencies!['axis:axis'].dependencies![
      'commons-discovery:commons-discovery'
    ].dependencies!['commons-logging:commons-logging'].version,
  ).toBe('1.0.4');
});

test('parse `sbt dependencies` output: plugin 0.13', async () => {
  const sbtOutput = fs
    .readFileSync(
      path.join(__dirname, '..', 'fixtures', 'sbt-plugin-0.13-output.txt'),
      'utf8',
    )
    .split('\n');
  const depTree = parser.parseSbtPluginResults(
    sbtOutput,
    'com.example:hello_2.12',
    '1.0.0',
  );

  expect(depTree.name).toBe('com.example:hello_2.12');
  expect(depTree.version).toBe('0.1.0-SNAPSHOT');
  expect(
    depTree.dependencies!['axis:axis'].dependencies!['axis:axis-saaj']
      .dependencies!['org.apache.axis:axis-saaj'].version,
  ).toBe('1.4');
  expect(
    depTree.dependencies!['axis:axis'].dependencies![
      'commons-discovery:commons-discovery'
    ].dependencies!['commons-logging:commons-logging'].version,
  ).toBe('1.0.4');
});
