import {
  isValidColorInput,
  getRandomColorHex,
  changeColor,
  deletePeacocksColorCustomizations
} from './color-library';

import { State, peacockGreen } from './models';
import {
  updateWorkspaceConfiguration,
  getCurrentColorBeforeAdjustments,
  addNewFavoriteColor,
  writeRecommendedFavoriteColors
} from './configuration';
import {
  promptForColor,
  promptForFavoriteColor,
  promptForFavoriteColorName
} from './inputs';

import { resetLiveSharePreviousColors } from './live-share';

export async function resetColorsHandler() {
  const colorCustomizations = deletePeacocksColorCustomizations();
  State.recentColor = '';
  const newColorCustomizations = isObjectEmpty(colorCustomizations)
    ? undefined
    : colorCustomizations;

  resetLiveSharePreviousColors();

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

export async function enterColorHandler(color?: string) {
  const input = color ? color : await promptForColor();
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

export async function addRecommendedFavoritesHandler() {
  await writeRecommendedFavoriteColors();
}

export async function changeColorToPeacockGreenHandler() {
  return await changeColor(peacockGreen);
}

export async function changeColorToFavoriteHandler() {
  const input = await promptForFavoriteColor();
  if (isValidColorInput(input)) {
    await changeColor(input);
  }
}

function isObjectEmpty(o: {}) {
  return !Object.keys(o).length;
}
