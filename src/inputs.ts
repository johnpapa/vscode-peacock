import * as vscode from 'vscode';
import { BuiltInColors } from './constants/enums';
import { getPreferredColors } from './configuration';

export async function promptForColor() {
  const options: vscode.InputBoxOptions = {
    ignoreFocusOut: true,
    placeHolder: BuiltInColors.Vue,
    prompt:
      'Enter a background color for the title bar in RGB hex format or a valid HTML color name',
    value: BuiltInColors.Vue
  };
  const inputColor = await vscode.window.showInputBox(options);
  return inputColor || '';
}

export async function promptForPreferedColor() {
  const preferredColors = getPreferredColors();
  let selectedColor = '';
  if (preferredColors && preferredColors.length) {
    selectedColor =
      (await vscode.window.showQuickPick(preferredColors, {
        placeHolder: 'Pick a preferred color'
        // onDidSelectItem: item =>
        //   vscode.window.showInformationMessage(`Focus ${++i}: ${item}`)
      })) || '';
  }
  // vscode.window.showInformationMessage(`Got: ${result}`);
  return selectedColor || '';
}
