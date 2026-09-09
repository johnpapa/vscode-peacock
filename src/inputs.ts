import * as vscode from 'vscode';
import { peacockGreen, customColorPickerLabel } from './models';
import { getFavoriteColors, getEnvironmentAwareColor } from './configuration';
import { applyColor } from './apply-color';
import { parseFavoriteColorValue } from './favorite-color';
import { promptForCustomColorViaColorPicker } from './color-picker-webview';

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
  const { menu } = getFavoriteColors();
  const menuWithCustomColor = [...menu, customColorPickerLabel];
  const options = {
    placeHolder: 'Pick a favorite color, or choose Custom color… to pick one visually',
    onDidSelectItem: await tryColorWithPeacock(),
  };
  const selection = (await vscode.window.showQuickPick(menuWithCustomColor, options)) || '';

  if (selection === customColorPickerLabel) {
    const startingColor = getEnvironmentAwareColor();
    return await promptForCustomColorViaColorPicker(startingColor);
  }

  if (selection) {
    const selectedColor = parseFavoriteColorValue(selection);
    return selectedColor || '';
  }

  return '';
}

async function tryColorWithPeacock() {
  return async (item: string) => {
    const color = parseFavoriteColorValue(item);
    return await applyColor(color);
  };
}
