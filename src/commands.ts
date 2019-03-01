import * as vscode from 'vscode';
import { 
  isValidColorInput,
  getBackgroundColorHex,
  getForegroundColorHex,
  getRandomColorHex
} from './color-library';

import { BuiltInColors, ColorSettings } from './models';
import { prepareColors, changeColorSetting } from './configuration';
import { promptForColor, promptForPreferedColor } from './inputs';

const { workspace } = vscode;

// Create the handlers for the commands
export async function resetColorsHandler() {
  // Domain of all color settings we affect
  const colorCustomizations = workspace
    .getConfiguration()
    .get('workbench.colorCustomizations');

  const newColorCustomizations: any = {
    ...colorCustomizations
  };
  Object.values(ColorSettings).forEach(setting => {
    delete newColorCustomizations[setting];
  });

  return await workspace
    .getConfiguration()
    .update(
      'workbench.colorCustomizations',
      newColorCustomizations,
      vscode.ConfigurationTarget.Workspace
    );
}

async function changeColor(input: string = '') {
  const backgroundHex = getBackgroundColorHex(input);
  const foregroundHex = getForegroundColorHex(backgroundHex);
  const colorCustomizations = prepareColors(backgroundHex, foregroundHex);
  return await changeColorSetting(colorCustomizations);
}

export async function enterColorHandler() {
  const input = await promptForColor();
  if (!isValidColorInput(input)) {
    throw new Error(`Invalid HEX or named color "${input}"`);
  }

  return await changeColor(input);
}

export async function changeColorToRandomHandler() {
  return await changeColor(getRandomColorHex());
}

export async function changeColorToVueGreenHandler() {
  return await changeColor(BuiltInColors.Vue);
}

export async function changeColorToAngularRedHandler() {
  return await changeColor(BuiltInColors.Angular);
}

export async function changeColorToReactBlueHandler() {
  return await changeColor(BuiltInColors.React);
}

export async function changeColorToPreferredHandler() {
  const input = await promptForPreferedColor();
  if (isValidColorInput(input)) {
    await changeColor(input);
  }
}
