// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "papa-colored" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    'extension.helloWorld',
    () => {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage('Hello World!');
    }
  );

  vscode.commands.registerCommand('extension.changeTitlebarColor', async () => {
    if (vscode.window.activeTextEditor) {
      // await vscode.workspace
      //   .getConfiguration()
      //   .update('conf.titlebarColor', '#f0f0f0', false);

      const colorCustomizations = await vscode.workspace
        .getConfiguration()
        .get('workbench.colorCustomizations');

      const options: vscode.InputBoxOptions = {
        ignoreFocusOut: true,
        placeHolder: '#ff00ff',
        prompt: 'Enter a background color for the title bar',
        value: '#42b883' // default to Vue green

        // placeHolder: localize("cmd.otherOptions.preserve.placeholder"),
        // prompt: localize("cmd.otherOptions.preserve.prompt")
      };
      const input = await vscode.window.showInputBox(options);
      const hexInput = formatHex(input);
      if (!isValidHexColor(hexInput)) {
        return;
      }

      // let backgroundHex: string = generateRandomHexColor();

      let backgroundHex = hexInput;
      const foregroundHex = formatHex(invertColor(backgroundHex));

      // For debugging we use status bar, as title bar is unavailable when debugging
      // const newColorCustomizations = {
      //   ...colorCustomizations,
      //   'statusBar.background': backgroundHex,
      //   'statusBar.foreground': foregroundHex
      // };

      const newColorCustomizations = {
        ...colorCustomizations,
        'titleBar.activeBackground': backgroundHex,
        'titleBar.activeForeground': foregroundHex
      };

      await vscode.workspace
        .getConfiguration()
        .update('workbench.colorCustomizations', newColorCustomizations, false);
    }
  });

  context.subscriptions.push(disposable);
}
function randomDigit() {
  return Math.floor(Math.random() * 10);
}

function invertColor(hex: string) {
  // credit: https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
  if (hex.indexOf('#') === 0) {
    hex = hex.slice(1);
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6) {
    throw new Error('Invalid HEX color.');
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // credit: http://stackoverflow.com/a/3943023/112731
  return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? '000000' : 'FFFFFF';
}

function isValidHexColor(input: string) {
  return /^#[0-9A-F]{6}$/i.test(input);
}

function formatHex(input: string = '') {
  return input.substr(0, 1) === '#' ? input : `#${input}`;
}

function generateRandomHexColor() {
  return (
    '' +
    randomDigit().toString() +
    randomDigit().toString() +
    randomDigit().toString() +
    randomDigit().toString() +
    randomDigit().toString() +
    randomDigit().toString()
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
