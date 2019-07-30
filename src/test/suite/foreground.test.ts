import vscode = require('vscode');
import sinon = require('sinon');
import { IPeacockSettings, Commands, ColorSettings } from '../../models';
import { setupTestSuite, teardownTestSuite } from './lib/setup-teardown-test-suite';
import assert = require('assert');
import { isValidColorInput } from '../../color-library';
import { executeCommand } from './lib/constants';
import {
  getColorCustomizationConfig,
  getLightForegroundColorOrOverride,
  getDarkForegroundColorOrOverride,
} from '../../configuration';

suite('Foreground color', () => {
  let originalValues = <IPeacockSettings>{};

  suiteSetup(async () => {
    await setupTestSuite(originalValues);
  });

  suiteTeardown(() => teardownTestSuite(originalValues));

  setup(async () => {
    await executeCommand(Commands.resetWorkspaceColors);
  });

  test(
    'is set to light foreground on black backgrounds',
    createForegroundTest('hsl (0, 0, 0)', getLightForegroundColorOrOverride()),
  );

  test(
    'is set to light foreground on dark backgrounds',
    createForegroundTest('hsl (0, 0, 25%)', getLightForegroundColorOrOverride()),
  );

  test(
    'is set to light foreground on less than 50% bright backgrounds',
    createForegroundTest('hsl (0, 0, 49%)', getLightForegroundColorOrOverride()),
  );

  test(
    'is set to dark foreground on greater than or equal to 50% bright backgrounds',
    createForegroundTest('hsl (0, 0, 50%)', getDarkForegroundColorOrOverride()),
  );

  test(
    'is set to dark foreground on light backgrounds',
    createForegroundTest('hsl (0, 0, 75%)', getDarkForegroundColorOrOverride()),
  );

  test(
    'is set to dark foreground on white backgrounds',
    createForegroundTest('hsl (0, 100%, 100%)', getDarkForegroundColorOrOverride()),
  );
});

function createForegroundTest(fakeResponse: string, expectedValue: string) {
  return async () => {
    // Stub the async input box to return a response
    const stub = await sinon
      .stub(vscode.window, 'showInputBox')
      .returns(Promise.resolve(fakeResponse));

    // fire the command
    await executeCommand(Commands.enterColor);
    let config = getColorCustomizationConfig();
    const value = config[ColorSettings.activityBar_foreground];
    stub.restore();

    assert.ok(isValidColorInput(value));
    assert.equal(expectedValue, value);
  };
}
