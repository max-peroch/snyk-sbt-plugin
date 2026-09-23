import * as plugin from '../../lib';

test('check build args with array not coursier', () => {
  const result = plugin.buildArgs(['-Paxis', '-Pjaxen'], false);
  expect(result).toEqual([
    '-Dsbt.log.noformat=true',
    '-Paxis',
    '-Pjaxen',
    'set asciiGraphWidth := 999999999; dependencyTree',
  ]);
});

test('check build args with string not coursie', () => {
  const result = plugin.buildArgs('-Paxis -Pjaxen', false);
  expect(result).toEqual([
    '-Dsbt.log.noformat=true',
    '-Paxis -Pjaxen',
    'set asciiGraphWidth := 999999999; dependencyTree',
  ]);
});

test('check build args with array for coursier', () => {
  const result = plugin.buildArgs(['-Paxis', '-Pjaxen'], true);
  expect(result).toEqual([
    '-Dsbt.log.noformat=true',
    '-Paxis',
    '-Pjaxen',
    'coursierDependencyTree',
  ]);
});

test('check build args with string for coursier', () => {
  const result = plugin.buildArgs('-Paxis -Pjaxen', true);
  expect(result).toEqual([
    '-Dsbt.log.noformat=true',
    '-Paxis -Pjaxen',
    'coursierDependencyTree',
  ]);
});

test('check build args with string for snykRenderTree', () => {
  const result = plugin.buildArgs('-Paxis -Pjaxen', false, true);
  expect(result).toEqual([
    '-Dsbt.log.noformat=true',
    '-Paxis -Pjaxen',
    'snykRenderTree',
  ]);
});

test('check build args with string for coursier and not snykRenderTree', () => {
  const result = plugin.buildArgs('-Paxis -Pjaxen', true, false);
  expect(result).toEqual([
    '-Dsbt.log.noformat=true',
    '-Paxis -Pjaxen',
    'coursierDependencyTree',
  ]);
});

test('check build args with string for not coursier and not snykRenderTree', () => {
  const result = plugin.buildArgs('-Paxis -Pjaxen', false, false);
  expect(result).toEqual([
    '-Dsbt.log.noformat=true',
    '-Paxis -Pjaxen',
    'set asciiGraphWidth := 999999999; dependencyTree',
  ]);
});

test('native dependencyTree path uses a single sbt command argv', () => {
  const result = plugin.buildArgs(undefined, false, false);
  const commands = result.filter((arg) => !arg.startsWith('-'));
  expect(commands).toEqual([
    'set asciiGraphWidth := 999999999; dependencyTree',
  ]);
  expect(commands[0].split(';').map((part) => part.trim())).toEqual([
    'set asciiGraphWidth := 999999999',
    'dependencyTree',
  ]);
});
