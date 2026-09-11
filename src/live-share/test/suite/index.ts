import * as path from 'path';
import * as MochaModule from 'mocha';
import { glob } from 'glob';

// mocha@12's CJS build exposes the Mocha class as a named export rather than
// as the module's whole export value, but @types/mocha still types the
// module as `export = Mocha`. Pull the real constructor off the runtime
// module and keep the constructor type from `export =`.
const Mocha = (MochaModule as unknown as { Mocha: typeof MochaModule }).Mocha;

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    //----------------------------------------
    // Stuff from old test setup
    timeout: 200000, // longer timeout, in case
    // useColors: true, // colored output from test results
    //----------------------------------------
  });
  // mocha.useColors(true);

  const testsRoot = path.resolve(__dirname, '..');

  return glob('**/**.test.js', { cwd: testsRoot }).then(files => {
    // Add files to the test suite
    files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

    return new Promise<void>((c, e) => {
      try {
        // Run the mocha test
        mocha.run((failures: number) => {
          if (failures > 0) {
            e(new Error(`${failures} tests failed.`));
          } else {
            c();
          }
        });
      } catch (err) {
        e(err);
      }
    });
  });
}
