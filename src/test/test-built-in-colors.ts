import * as vscode from 'vscode';
import * as assert from 'assert';
import { Commands, ColorSettings, BuiltInColors } from '../models';
import { getPeacockWorkspaceConfig } from './helpers';

export function testChangingColorToAngularRed():
  | ((this: Mocha.ITestCallbackContext, done: MochaDone) => any)
  | undefined {
  return testBuiltInColor(
    Commands.changeColorToAngularRed,
    BuiltInColors.Angular
  );
}
export function testChangingColorToVueGreen():
  | ((this: Mocha.ITestCallbackContext, done: MochaDone) => any)
  | undefined {
  return testBuiltInColor(Commands.changeColorToVueGreen, BuiltInColors.Vue);
}
export function testChangingColorToReactBlue():
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
