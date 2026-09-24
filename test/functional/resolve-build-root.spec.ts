import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as subProcess from '../../lib/sub-process';
import { resolveBuildRoot } from '../../lib';
import { realpathOrResolve } from '../../lib/sbt-build-root';

const root = path.join(__dirname, '..', 'fixtures', 'testproj-multi-module');
const nested = path.join(root, 'subModule');

const projectsOutput = [
  '[info] In file:' + root + '/',
  '[info] \t   child',
  '[info] \t * mainModule',
];

describe('resolveBuildRoot', () => {
  afterEach(() => jest.restoreAllMocks());

  it('uses the parent build when base directories cannot be listed', async () => {
    const execute = jest
      .spyOn(subProcess, 'execute')
      .mockImplementation(async (_cmd, args) => {
        const last = args[args.length - 1];
        if (last === 'projects') {
          return projectsOutput;
        }
        // Both snykListProjectBases and the `show …/baseDirectory` fallback fail.
        throw new Error('sbt failed');
      });

    const result = await resolveBuildRoot(nested, undefined);

    expect(result).toEqual({
      buildRoot: root,
      projects: ['child', 'mainModule'],
    });
    expect(execute).toHaveBeenCalledWith('sbt', expect.any(Array), {
      cwd: root,
    });
  });

  it('keeps the nested dir as its own build when the parent does not reference it', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sbt-resolve-root-'));
    try {
      const parent = realpathOrResolve(tmp);
      const standalone = path.join(parent, 'standalone');
      fs.mkdirSync(standalone);
      fs.writeFileSync(
        path.join(parent, 'build.sbt'),
        'lazy val core = project in file("core")\n',
      );
      fs.writeFileSync(path.join(standalone, 'build.sbt'), 'name := "x"\n');

      jest
        .spyOn(subProcess, 'execute')
        .mockImplementation(async (_cmd, args, options) => {
          if (args[args.length - 1] === 'projects' && options.cwd === parent) {
            return [
              '[info] In file:' + parent + '/',
              '[info] \t   core',
              '[info] \t * root',
            ];
          }
          throw new Error('sbt failed');
        });

      const result = await resolveBuildRoot(standalone, undefined);

      expect(result.buildRoot).toBe(standalone);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
