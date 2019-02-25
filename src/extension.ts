// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {
  resetColorSettings,
  isValidHexColor,
  formatHex,
  invertColor,
  promptForHexColor,
  changeColorSetting,
  generateRandomHexColor
} from './utils';
import { Commands, builtInColors } from './enums';

// Create the handlers for the commands
const resetColorsHandler = async () => resetColorSettings();
const changeColorHandler = async () => {
  const backgroundHex = await promptForHexColor();
  if (!isValidHexColor(backgroundHex)) {
    return;
  }
  const foregroundHex = formatHex(invertColor(backgroundHex));
  changeColorSetting(backgroundHex, foregroundHex);
};
const changeColorToRandomHandler = async () => {
  const backgroundHex = generateRandomHexColor();
  const foregroundHex = formatHex(invertColor(backgroundHex));
  changeColorSetting(backgroundHex, foregroundHex);
};
const changeColorToVueGreenHandler = async () => {
  const backgroundHex = builtInColors.vue;
  const foregroundHex = formatHex(invertColor(backgroundHex));
  changeColorSetting(backgroundHex, foregroundHex);
};
const changeColorToAngularRedHandler = async () => {
  const backgroundHex = builtInColors.angular;
  const foregroundHex = formatHex(invertColor(backgroundHex));
  changeColorSetting(backgroundHex, foregroundHex);
};
const changeColorToReactBlueHandler = async () => {
  const backgroundHex = builtInColors.react;
  const foregroundHex = formatHex(invertColor(backgroundHex));
  changeColorSetting(backgroundHex, foregroundHex);
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Extension "vscode-peacock" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  /// Register the commands
  vscode.commands.registerCommand(Commands.resetColors, resetColorsHandler);

  vscode.commands.registerCommand(Commands.changeColor, changeColorHandler);

  vscode.commands.registerCommand(
    Commands.changeColorToRandom,
    changeColorToRandomHandler
  );

  vscode.commands.registerCommand(
    Commands.changeColorToVueGreen,
    changeColorToVueGreenHandler
  );

  vscode.commands.registerCommand(
    Commands.changeColorToAngularRed,
    changeColorToAngularRedHandler
  );

  vscode.commands.registerCommand(
    Commands.changeColorToReactBlue,
    changeColorToReactBlueHandler
  );

  // context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
