import {
  isValidColorInput,
  getRandomColorHex,
  changeColor,
  deletePeacocksColorCustomizations,
  getDarkenedColorHex,
  getLightenedColorHex
} from './color-library';

import { State, peacockGreen } from './models';
import {
  updateWorkspaceConfiguration,
  getCurrentColorBeforeAdjustments,
  addNewFavoriteColor,
  writeRecommendedFavoriteColors,
  getDarkenLightenPercentage
} from './configuration';
import {
  promptForColor,
  promptForFavoriteColor,
  promptForFavoriteColorName
} from './inputs';

import { resetLiveSharePreviousColors } from './live-share';
import { resetRemotePreviousColors } from './remote';
import { resetMementos } from './mementos';

export async function resetColorsHandler() {
  const colorCustomizations = deletePeacocksColorCustomizations();
  State.recentColor = '';
  const newColorCustomizations = isObjectEmpty(colorCustomizations)
    ? undefined
    : colorCustomizations;

  await resetLiveSharePreviousColors();
  await resetRemotePreviousColors();
  await resetMementos();

  await updateWorkspaceConfiguration(newColorCustomizations);
  return State.extensionContext;
}

export async function saveColorToFavoritesHandler() {
  const color = getCurrentColorBeforeAdjustments();
  const name = await promptForFavoriteColorName(color);
  if (!name) {
    return;
  }
  await addNewFavoriteColor(name, color);
  return State.extensionContext;
}

export async function enterColorHandler(color?: string) {
  const input = color ? color : await promptForColor();
  if (!input) {
    return;
  }
  if (!isValidColorInput(input)) {
    throw new Error(`Invalid HEX or named color "${input}"`);
  }
  await changeColor(input);
  return State.extensionContext;
}

export async function changeColorToRandomHandler() {
  await changeColor(getRandomColorHex());
  return State.extensionContext;
}

export async function addRecommendedFavoritesHandler() {
  await writeRecommendedFavoriteColors();
  return State.extensionContext;
}

export async function changeColorToPeacockGreenHandler() {
  await changeColor(peacockGreen);
  return State.extensionContext;
}

export async function changeColorToFavoriteHandler() {
  const input = await promptForFavoriteColor();
  if (isValidColorInput(input)) {
    await changeColor(input);
  }
  return State.extensionContext;
}

export async function darkenHandler() {
  const color = getCurrentColorBeforeAdjustments();
  const darkenLightenPercentage = getDarkenLightenPercentage();
  const darkenedColor = getDarkenedColorHex(color, darkenLightenPercentage);
  await changeColor(darkenedColor);
  return State.extensionContext;
}

export async function lightenHandler() {
  const color = getCurrentColorBeforeAdjustments();
  const darkenLightenPercentage = getDarkenLightenPercentage();
  const lightenedColor = getLightenedColorHex(color, darkenLightenPercentage);
  await changeColor(lightenedColor);
  return State.extensionContext;
}

function isObjectEmpty(o: {}) {
  return !Object.keys(o).length;
}
