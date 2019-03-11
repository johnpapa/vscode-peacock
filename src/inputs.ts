import * as vscode from 'vscode';
import { BuiltInColors, favoriteColorSeparator } from './models';
import {
  getFavoriteColors,
  getCurrentColorBeforeAdjustments
} from './configuration';
import { changeColor } from './color-library';

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
  const startingColor = getCurrentColorBeforeAdjustments();
  const options = {
    placeHolder: 'Pick a favorite color',
    onDidSelectItem: tryColorWithPeacock()
  };
  if (favoriteColors && favoriteColors.length) {
    selection = (await vscode.window.showQuickPick(menu, options)) || '';
  }
  if (!selection) {
    // when there is no selection, revert to starting color
    await changeColor(startingColor);
    return '';
  }

  let selectedColor = parseFavoriteColorValue(selection);
  return selectedColor || '';
}

export function parseFavoriteColorValue(text: string) {
  const sep = favoriteColorSeparator;
  return text.substring(text.indexOf(sep) + sep.length + 1);
}

function tryColorWithPeacock() {
  return async (item: string) => {
    const color = parseFavoriteColorValue(item as string);
    return await changeColor(color);
  };
}
