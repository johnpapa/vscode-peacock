import vscode = require('vscode');
import sinon = require('sinon');
import {
  IPeacockSettings,
  Commands,
  ForegroundColors,
  ColorSettings
} from '../models';
import {
  setupTestSuite,
  teardownTestSuite
} from './lib/setup-teardown-test-suite';
import { executeCommand, getPeacockWorkspaceConfig } from './lib/helpers';
import assert = require('assert');
import { isValidColorInput } from '../color-library';

suite('Foreground color', () => {
  let extension: vscode.Extension<any>;
  let originalValues = <IPeacockSettings>{};

  suiteSetup(async () => {
    extension = await setupTestSuite(extension, originalValues);
  });

  setup(async () => {
    await executeCommand(Commands.resetColors);
  });

  test(
    'is set to light foreground on black backgrounds',
    createForegroundTest('hsl (0, 0, 0)', ForegroundColors.LightForeground)
  );

  test(
    'is set to light foreground on dark backgrounds',
    createForegroundTest('hsl (0, 0, 25%)', ForegroundColors.LightForeground)
  );

  test(
    'is set to light foreground on less than 50% bright backgrounds',
    createForegroundTest('hsl (0, 0, 49%)', ForegroundColors.LightForeground)
  );

  test(
    'is set to dark foreground on greater than or equal to 50% bright backgrounds',
    createForegroundTest('hsl (0, 0, 50%)', ForegroundColors.DarkForeground)
  );

  test(
    'is set to dark foreground on light backgrounds',
    createForegroundTest('hsl (0, 0, 75%)', ForegroundColors.DarkForeground)
  );

  test(
    'is set to dark foreground on white backgrounds',
    createForegroundTest('hsl (0, 100%, 100%)', ForegroundColors.DarkForeground)
  );

  suiteTeardown(() => teardownTestSuite(originalValues));
});

function createForegroundTest(fakeResponse: string, expectedValue: string) {
  return async () => {
    // Stub the async input box to return a response
    const stub = await sinon
      .stub(vscode.window, 'showInputBox')
      .returns(Promise.resolve(fakeResponse));

    // fire the command
    await executeCommand(Commands.enterColor);
    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.activityBar_foreground];
    stub.restore();

    assert.ok(isValidColorInput(value));
    assert.equal(expectedValue, value);
  };
}
