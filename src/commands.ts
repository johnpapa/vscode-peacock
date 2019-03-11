import * as vscode from 'vscode';
import {
  isValidColorInput,
  getRandomColorHex,
  changeColor,
  deletePeacocksColorCustomizations
} from './color-library';

import { BuiltInColors, ColorSettings, state } from './models';
import {
  changeColorSetting,
  getCurrentColorBeforeAdjustments,
  addNewFavoriteColor,
  getExistingColorCustomizations
} from './configuration';
import {
  promptForColor,
  promptForFavoriteColor,
  promptForFavoriteColorName
} from './inputs';
import { isObjectEmpty } from './test/lib/helpers';

// Create the handlers for the commands
export async function resetColorsHandler() {
  const newColorCustomizations = deletePeacocksColorCustomizations();

  state.recentColor = '';

  const config = isObjectEmpty(newColorCustomizations)
    ? undefined
    : newColorCustomizations;

  return changeColorSetting(config);
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
