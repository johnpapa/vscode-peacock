import * as vscode from 'vscode';
import { BuiltInColors, preferredColorSeparator } from './constants/enums';
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
  const sep = preferredColorSeparator;
  const { menu, values: preferredColors } = getPreferredColors();
  let selection = '';
  if (preferredColors && preferredColors.length) {
    selection =
      (await vscode.window.showQuickPick(menu, {
        placeHolder: 'Pick a preferred color'
        // onDidSelectItem: item =>
        //   vscode.window.showInformationMessage(`Focus ${++i}: ${item}`)
      })) || '';
  }
  // vscode.window.showInformationMessage(`Got: ${result}`);
  let selectedColor = parsePreferredColorValue(selection);
  return selectedColor || '';
}

export function parsePreferredColorValue(text: string) {
  const sep = preferredColorSeparator;
  return text.substring(text.indexOf(sep) + sep.length + 1);
}
