import {
  isValidColorInput,
  getRandomColorHex,
  changeColor,
  deletePeacocksColorCustomizations
} from './color-library';

import { BuiltInColors, State, StandardSettings } from './models';
import {
  updateWorkspaceConfiguration,
  getCurrentColorBeforeAdjustments,
  addNewFavoriteColor
} from './configuration';
import {
  promptForColor,
  promptForFavoriteColor,
  promptForFavoriteColorName
} from './inputs';
import { isObjectEmpty } from './helpers';
import { window } from 'vscode';

export async function resetColorsHandler() {
  const colorCustomizations = deletePeacocksColorCustomizations();
  State.recentColor = '';
  const newColorCustomizations = isObjectEmpty(colorCustomizations)
    ? undefined
    : colorCustomizations;
  return await updateWorkspaceConfiguration(newColorCustomizations);
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
