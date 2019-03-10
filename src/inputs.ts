import * as vscode from 'vscode';
import { BuiltInColors, favoriteColorSeparator } from './models';
import { getFavoriteColors } from './configuration';

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

export async function promptForFavoriteColorName(color: string) {
  if (!color) {
    return;
  }
  const options: vscode.InputBoxOptions = {
    ignoreFocusOut: true,
    placeHolder: 'Mandalorian Blue',
    prompt: `Enter a name for the color ${color}`,
    value: ''
  };
  const inputName = await vscode.window.showInputBox(options);
  return inputName || '';
}

export async function promptForFavoriteColor() {
  const { menu, values: favoriteColors } = getFavoriteColors();
  let selection = '';
  if (favoriteColors && favoriteColors.length) {
    selection =
      (await vscode.window.showQuickPick(menu, {
        placeHolder: 'Pick a favorite color'
        // onDidSelectItem: item =>
        //   vscode.window.showInformationMessage(`Focus ${++i}: ${item}`)
      })) || '';
  }
  // vscode.window.showInformationMessage(`Got: ${result}`);
  let selectedColor = parseFavoriteColorValue(selection);
  return selectedColor || '';
}

export function parseFavoriteColorValue(text: string) {
  const sep = favoriteColorSeparator;
  return text.substring(text.indexOf(sep) + sep.length + 1);
}
