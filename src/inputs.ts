import * as vscode from 'vscode';
import { customColorPickerLabel } from './models';
import { getFavoriteColors, getEnvironmentAwareColor } from './configuration';
import { applyColor } from './apply-color';
import { parseFavoriteColorValue } from './favorite-color';
import { promptForCustomColorViaColorPicker } from './color-picker-webview';

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
    // "Custom color…" is not a favorite -- it's the Quick Pick item that
    // opens the color picker panel. Merely highlighting it (e.g. arrowing
    // down to it, before ever selecting it) must not touch the applied
    // color: parseFavoriteColorValue() on its label has no
    // favoriteColorSeparator, so it returns a garbage substring that
    // applyColor() treats as invalid input and responds to by unapplying
    // every current Peacock color (title bar, activity bar, status bar)
    // the instant the item is highlighted (#708 follow-up).
    if (item === customColorPickerLabel) {
      return;
    }
    const color = parseFavoriteColorValue(item);
    return await applyColor(color);
  };
}
