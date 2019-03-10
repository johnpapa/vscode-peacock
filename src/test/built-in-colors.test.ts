import * as vscode from 'vscode';
import * as assert from 'assert';
import {
  Commands,
  ColorSettings,
  BuiltInColors,
  IPeacockSettings
} from '../models';
import { allSetupAndTeardown } from './lib/setup-teardown-test-suite';
import { executeCommand } from './lib/constants';
import { isValidColorInput } from '../color-library';
import { getPeacockWorkspaceConfig } from '../configuration';

suite('can set color to built-in color', () => {
  let originalValues = <IPeacockSettings>{};
  allSetupAndTeardown(originalValues);

  test('can set color to Angular Red', testChangingColorToAngularRed());

  test('can set color to Vue Green', testChangingColorToVueGreen());

  test('can set color to React Blue', testChangingColorToReactBlue());

  test('can set color to Random color', async () => {
    await executeCommand(Commands.changeColorToRandom);
    let config = getPeacockWorkspaceConfig();
    assert.ok(
      isValidColorInput(config[ColorSettings.titleBar_activeBackground])
    );
  });

  test('can reset colors', async () => {
    await executeCommand(Commands.resetColors);
    let config = getPeacockWorkspaceConfig();
    assert.ok(!config[ColorSettings.titleBar_activeBackground]);
    assert.ok(!config[ColorSettings.statusBar_background]);
    assert.ok(!config[ColorSettings.activityBar_background]);
  });
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
