// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Commands } from './models';
import {
  resetColorsHandler,
  enterColorHandler,
  changeColorToRandomHandler,
  changeColorToVueGreenHandler,
  changeColorToAngularRedHandler,
  changeColorToReactBlueHandler,
  changeColorToPreferredHandler
} from './commands';

const { commands } = vscode;

// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Extension "vscode-peacock" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  /// Register the commands
  commands.registerCommand(Commands.resetColors, resetColorsHandler);

  commands.registerCommand(Commands.enterColor, enterColorHandler);

  commands.registerCommand(
    Commands.changeColorToRandom,
    changeColorToRandomHandler
  );

  commands.registerCommand(
    Commands.changeColorToVueGreen,
    changeColorToVueGreenHandler
  );

  commands.registerCommand(
    Commands.changeColorToAngularRed,
    changeColorToAngularRedHandler
  );

  commands.registerCommand(
    Commands.changeColorToReactBlue,
    changeColorToReactBlueHandler
  );

  commands.registerCommand(
    Commands.changeColorToPreferred,
    changeColorToPreferredHandler
  );

  // context.subscriptions.push(disposable);
}

export function deactivate() {
  console.log('Extension "vscode-peacock" is now deactive');
}
