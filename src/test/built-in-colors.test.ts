import * as vscode from 'vscode';
import * as assert from 'assert';
import {
  Commands,
  ColorSettings,
  BuiltInColors,
  IPeacockSettings
} from '../models';
import { getPeacockWorkspaceConfig } from './lib/helpers';
import {
  teardownTestSuite,
  setupTestSuite
} from './lib/setup-teardown-test-suite';

suite('can set color to built-in color', () => {
  let extension: vscode.Extension<any>;
  let originalValues = <IPeacockSettings>{};

  suiteSetup(async () => {
    extension = await setupTestSuite(extension, originalValues);
  });

  test('can set color to Angular Red', testChangingColorToAngularRed());

  test('can set color to Vue Green', testChangingColorToVueGreen());

  test('can set color to React Blue', testChangingColorToReactBlue());

  suiteTeardown(() => teardownTestSuite(originalValues));
});

function testChangingColorToAngularRed():
  | ((this: Mocha.ITestCallbackContext, done: MochaDone) => any)
  | undefined {
  return testBuiltInColor(
    Commands.changeColorToAngularRed,
    BuiltInColors.Angular
  );
}
function testChangingColorToVueGreen():
  | ((this: Mocha.ITestCallbackContext, done: MochaDone) => any)
  | undefined {
  return testBuiltInColor(Commands.changeColorToVueGreen, BuiltInColors.Vue);
}
function testChangingColorToReactBlue():
  | ((this: Mocha.ITestCallbackContext, done: MochaDone) => any)
  | undefined {
  return testBuiltInColor(Commands.changeColorToReactBlue, BuiltInColors.React);
}

function testBuiltInColor(
  cmd: Commands,
  builtInColor: BuiltInColors
): ((this: Mocha.ITestCallbackContext, done: MochaDone) => any) | undefined {
  return async () => {
    await vscode.commands.executeCommand(cmd);
    let config = getPeacockWorkspaceConfig();
    assert.equal(builtInColor, config[ColorSettings.titleBar_activeBackground]);
  };
}
