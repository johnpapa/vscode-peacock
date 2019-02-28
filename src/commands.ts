import * as vscode from 'vscode';
import { isValidHexColor, isValidNamedColor } from './color-library';

import { BuiltInColors, ColorSettings } from './constants/enums';
import { prepareColors, changeColorSetting } from './configuration';
import {
  convertNameToHex,
  formatHex,
  invertColor,
  generateRandomHexColor
} from './color-library';
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

export async function enterColorHandler() {
  const backgroundColorInput = await promptForColor();
  let backgroundColorHex: string = '';

  if (isValidHexColor(backgroundColorInput)) {
    backgroundColorHex = backgroundColorInput;
  } else if (isValidNamedColor(backgroundColorInput)) {
    backgroundColorHex = convertNameToHex(backgroundColorInput.toLowerCase());
  }
  if (!backgroundColorHex) {
    throw new Error(`Invalid HEX or named color ${backgroundColorHex}`);
  }

  const foregroundHex = formatHex(invertColor(backgroundColorHex));
  const colorCustomizations = prepareColors(backgroundColorHex, foregroundHex);
  return await changeColorSetting(colorCustomizations);
}

export async function changeColorToRandomHandler() {
  const backgroundHex = generateRandomHexColor();
  const foregroundHex = formatHex(invertColor(backgroundHex));
  const colorCustomizations = prepareColors(backgroundHex, foregroundHex);
  return await changeColorSetting(colorCustomizations);
}

export async function changeColorToVueGreenHandler() {
  const backgroundHex = BuiltInColors.Vue;
  const foregroundHex = formatHex(invertColor(backgroundHex));
  const colorCustomizations = prepareColors(backgroundHex, foregroundHex);
  return await changeColorSetting(colorCustomizations);
}

export async function changeColorToAngularRedHandler() {
  const backgroundHex = BuiltInColors.Angular;
  const foregroundHex = formatHex(invertColor(backgroundHex));
  const colorCustomizations = prepareColors(backgroundHex, foregroundHex);
  return await changeColorSetting(colorCustomizations);
}

export async function changeColorToReactBlueHandler() {
  const backgroundHex = BuiltInColors.React;
  const foregroundHex = formatHex(invertColor(backgroundHex));
  const colorCustomizations = prepareColors(backgroundHex, foregroundHex);
  return await changeColorSetting(colorCustomizations);
}

export async function changeColorToPreferredHandler() {
  const backgroundColorInput = await promptForPreferedColor();
  let backgroundColorHex: string = '';

  if (isValidHexColor(backgroundColorInput)) {
    backgroundColorHex = backgroundColorInput;
  } else if (isValidNamedColor(backgroundColorInput)) {
    backgroundColorHex = convertNameToHex(backgroundColorInput.toLowerCase());
  }

  if (backgroundColorHex) {
    const foregroundHex = formatHex(invertColor(backgroundColorHex));
    const colorCustomizations = prepareColors(
      backgroundColorHex,
      foregroundHex
    );
    await changeColorSetting(colorCustomizations);
  }
}
