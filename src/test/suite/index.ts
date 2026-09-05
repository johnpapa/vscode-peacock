import * as path from 'path';
import * as MochaModule from 'mocha';
import * as glob from 'glob';
import { createReport } from '../coverage';

// mocha@12's CJS build exposes the Mocha class as a named export rather than
// as the module's whole export value, but @types/mocha still types the
// module as `export = Mocha`. Pull the real constructor off the runtime
// module and keep the constructor type from `export =`.
const Mocha = (MochaModule as unknown as { Mocha: typeof MochaModule }).Mocha;

// mocha@12 turned its built-in reporters into real ES6 classes, which broke
// mocha-multi-reporters (it calls `Base.call(this, runner)` instead of
// `new`). Rather than depend on that unmaintained package, run mocha's own
// Spec and XUnit reporters side by side against the same runner - mocha's
// `reporter` option accepts a constructor directly, not just a name.
class SpecAndXUnitReporter extends Mocha.reporters.Base {
  constructor(runner: MochaModule.Runner, options?: MochaModule.MochaOptions) {
    super(runner, options);
    new Mocha.reporters.Spec(runner, options);
    new Mocha.reporters.XUnit(runner, options);
  }
}

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    //----------------------------------------
    // Stuff from old test setup
    timeout: 7500, // longer timeout, in case
    // useColors: true, // colored output from test results
    //----------------------------------------
    reporter: SpecAndXUnitReporter,
    reporterOptions: {
      output: path.join(__dirname, '..', '..', 'test-results.xml'),
    },
  });
  // mocha.useColors(true);

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise<void>((c, e) => {
    glob('suite/**/*.test.js', { cwd: testsRoot }, (err: any, files: any) => {
      if (err) {
        return e(err);
      }

      // Add files to the test suite
      files.forEach((f: any) => mocha.addFile(path.resolve(testsRoot, f)));

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
  }).then(() => {
    // Tests have finished executing, check if we should generate a coverage report
    if (process.env['GENERATE_COVERAGE']) {
      createReport();
    }
  });
}
