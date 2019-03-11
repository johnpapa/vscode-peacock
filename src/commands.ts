import * as vscode from 'vscode';
import {
  isValidColorInput,
  getRandomColorHex,
  changeColor
} from './color-library';

import { BuiltInColors, ColorSettings, state } from './models';
import {
  changeColorSetting,
  getCurrentColorBeforeAdjustments,
  addNewFavoriteColor
} from './configuration';
import {
  promptForColor,
  promptForFavoriteColor,
  promptForFavoriteColorName
} from './inputs';

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

  state.recentColor = '';

  return changeColorSetting(newColorCustomizations);
}

export async function saveColorToFavoritesHandler() {
  const color = getCurrentColorBeforeAdjustments();

  const name = await promptForFavoriteColorName(color);
  if (!name) {
    return;
  }

  return await addNewFavoriteColor(name, color);
}

export async function enterColorHandler() {
  const input = await promptForColor();
  if (!input) {
    return;
  }

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

export async function changeColorToFavoriteHandler() {
  const input = await promptForFavoriteColor();
  if (isValidColorInput(input)) {
    await changeColor(input);
  }
}
