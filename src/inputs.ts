import * as vscode from 'vscode';
import { favoriteColorSeparator, peacockGreen } from './models';
import { getFavoriteColors } from './configuration';
import { applyColor } from './apply-color';

export async function promptForColor() {
  const options: vscode.InputBoxOptions = {
    ignoreFocusOut: true,
    placeHolder: peacockGreen,
    prompt:
      'Enter a background color for the title bar in RGB hex format or a valid HTML color name',
    value: peacockGreen,
  };
  const inputColor = (await vscode.window.showInputBox(options)) || '';
  return inputColor.trim();
}

export async function promptForFavoriteColorName(color: string) {
  if (!color) {
    return;
  }
  const options: vscode.InputBoxOptions = {
    ignoreFocusOut: true,
    placeHolder: 'Mandalorian Blue',
    prompt: `Enter a name for the color ${color}`,
    value: '',
  };
  const inputName = await vscode.window.showInputBox(options);
  return inputName || '';
}

export async function promptForFavoriteColor() {
  const { menu, values: favoriteColors } = getFavoriteColors();
  let selection = '';
  const options = {
    placeHolder: 'Pick a favorite color',
    onDidSelectItem: await tryColorWithPeacock(),
  };
  if (favoriteColors && favoriteColors.length) {
    selection = (await vscode.window.showQuickPick(menu, options)) || '';
  }
  if (selection) {
    const selectedColor = parseFavoriteColorValue(selection);
    return selectedColor || '';
  }

  return '';
}

export function parseFavoriteColorValue(text: string) {
  const sep = favoriteColorSeparator;
  return text.substring(text.indexOf(sep) + sep.length + 1);
}

async function tryColorWithPeacock() {
  return async (item: string) => {
    const color = parseFavoriteColorValue(item);
    return await applyColor(color, true);
  };
}
