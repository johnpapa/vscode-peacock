// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const colors = {
  vue: '#42b883',
  angular: '#b52e31',
  react: '#00b3e6'
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "vscode-peacock" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  vscode.commands.registerCommand('extension.changeColor', async () => {
    if (vscode.window.activeTextEditor) {
      const backgroundHex = await promptForHexColor();
      if (!isValidHexColor(backgroundHex)) {
        return;
      }
      const foregroundHex = formatHex(invertColor(backgroundHex));
      changeColorSetting(backgroundHex, foregroundHex);
    }
  });

  vscode.commands.registerCommand('extension.clearColor', async () => {
    removeColorSetting();
  });

  vscode.commands.registerCommand('extension.changeColorToRandom', async () => {
    const backgroundHex = generateRandomHexColor();
    const foregroundHex = formatHex(invertColor(backgroundHex));
    changeColorSetting(backgroundHex, foregroundHex);
  });

  vscode.commands.registerCommand(
    'extension.changeColorToVueGreen',
    async () => {
      const backgroundHex = colors.vue;
      const foregroundHex = formatHex(invertColor(backgroundHex));
      changeColorSetting(backgroundHex, foregroundHex);
    }
  );

  vscode.commands.registerCommand(
    'extension.changeColorToAngularRed',
    async () => {
      const backgroundHex = colors.angular;
      const foregroundHex = formatHex(invertColor(backgroundHex));
      changeColorSetting(backgroundHex, foregroundHex);
    }
  );

  vscode.commands.registerCommand(
    'extension.changeColorToReactBlue',
    async () => {
      const backgroundHex = colors.react;
      const foregroundHex = formatHex(invertColor(backgroundHex));
      changeColorSetting(backgroundHex, foregroundHex);
    }
  );

  // context.subscriptions.push(disposable);
}

async function removeColorSetting() {
  const colorCustomizations = await vscode.workspace
    .getConfiguration()
    .get('workbench.colorCustomizations');
  
  delete colorCustomizations['titleBar.activeBackground'];
  delete colorCustomizations['titleBar.activeForeground'];
  delete colorCustomizations['titleBar.inactiveBackground'];
  delete colorCustomizations['titleBar.inactiveForeground'];

  await vscode.workspace
    .getConfiguration()
    .update('workbench.colorCustomizations', colorCustomizations, false);
}

async function changeColorSetting(
  backgroundHex: string,
  foregroundHex: string
) {
  const colorCustomizations = await vscode.workspace
    .getConfiguration()
    .get('workbench.colorCustomizations');

  const newColorCustomizations = {
    ...colorCustomizations,
    'titleBar.activeBackground': backgroundHex,
    'titleBar.activeForeground': foregroundHex,
    'titleBar.inactiveBackground': backgroundHex,
    'titleBar.inactiveForeground': foregroundHex

    // use these for debugging only
    // ,'statusBar.background': backgroundHex,
    // 'statusBar.foreground': foregroundHex
  };

  await vscode.workspace
    .getConfiguration()
    .update('workbench.colorCustomizations', newColorCustomizations, false);
}

async function promptForHexColor() {
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
  return hexInput;
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
    throw new Error(`Invalid HEX color ${hex}`);
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
  // credit: https://www.paulirish.com/2009/random-hex-color-code-snippets/
  const hex = (
    '000000' + Math.floor(Math.random() * 16777215).toString(16)
  ).slice(-6);
  return '#' + hex;
}

// this method is called when your extension is deactivated
export function deactivate() {}
