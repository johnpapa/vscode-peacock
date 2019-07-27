import * as vscode from 'vscode';
import { favoriteColorSeparator, peacockGreen, Sections } from './models';
import { getFavoriteColors, getEnvironmentAwareColor } from './configuration';
import { changeColor, isValidColorInput } from './color-library';

export async function setPeacockColorCustomizations(colorCustomizations: any) {
  await vscode.workspace
    .getConfiguration()
    .update(
      Sections.workspacePeacockSection,
      colorCustomizations,
      vscode.ConfigurationTarget.Workspace,
    );
}

export async function promptForColor() {
  const options: vscode.InputBoxOptions = {
    ignoreFocusOut: true,
    placeHolder: peacockGreen,
    prompt:
      'Enter a background color for the title bar in RGB hex format or a valid HTML color name',
    value: peacockGreen,
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
    value: '',
  };
  const inputName = await vscode.window.showInputBox(options);
  return inputName || '';
}

export async function promptForFavoriteColor() {
  const { menu, values: favoriteColors } = getFavoriteColors();
  let selection = '';
  const startingColor = getEnvironmentAwareColor();
  const options = {
    placeHolder: 'Pick a favorite color',
    onDidSelectItem: await tryColorWithPeacock(),
  };
  if (favoriteColors && favoriteColors.length) {
    selection = (await vscode.window.showQuickPick(menu, options)) || '';
  }
  if (selection) {
    let selectedColor = parseFavoriteColorValue(selection);
    return selectedColor || '';
  }

  if (isValidColorInput(startingColor)) {
    // when there is no selection and startingColor, revert to starting color
    await changeColor(startingColor);
  } else {
    // if no color was previously set, reset the current color to `null`
    await setPeacockColorCustomizations(null);
  }

  return '';
}

export function parseFavoriteColorValue(text: string) {
  const sep = favoriteColorSeparator;
  return text.substring(text.indexOf(sep) + sep.length + 1);
}

async function tryColorWithPeacock() {
  return async (item: string) => {
    const color = parseFavoriteColorValue(item as string);
    return await changeColor(color, true);
  };
}
