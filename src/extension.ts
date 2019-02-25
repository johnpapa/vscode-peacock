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
  generateRandomHexColor,
  builtInColors,
  initialiseAffectedSettings
} from './utils';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Extension "vscode-peacock" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  vscode.commands.registerCommand('extension.resetColors', async () => {
    resetColorSettings();
  });

  vscode.commands.registerCommand('extension.changeColor', async () => {
    const backgroundHex = await promptForHexColor();
    if (!isValidHexColor(backgroundHex)) {
      return;
    }
    const foregroundHex = formatHex(invertColor(backgroundHex));
    changeColorSetting(backgroundHex, foregroundHex);
  });

  vscode.commands.registerCommand('extension.changeColorToRandom', async () => {
    const backgroundHex = generateRandomHexColor();
    const foregroundHex = formatHex(invertColor(backgroundHex));
    changeColorSetting(backgroundHex, foregroundHex);
  });

  vscode.commands.registerCommand(
    'extension.changeColorToVueGreen',
    async () => {
      const backgroundHex = builtInColors.vue;
      const foregroundHex = formatHex(invertColor(backgroundHex));
      changeColorSetting(backgroundHex, foregroundHex);
    }
  );

  vscode.commands.registerCommand(
    'extension.changeColorToAngularRed',
    async () => {
      const backgroundHex = builtInColors.angular;
      const foregroundHex = formatHex(invertColor(backgroundHex));
      changeColorSetting(backgroundHex, foregroundHex);
    }
  );

  vscode.commands.registerCommand(
    'extension.changeColorToReactBlue',
    async () => {
      const backgroundHex = builtInColors.react;
      const foregroundHex = formatHex(invertColor(backgroundHex));
      changeColorSetting(backgroundHex, foregroundHex);
    }
  );

  initialiseAffectedSettings();

  // context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
