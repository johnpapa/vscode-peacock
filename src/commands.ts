import {
  isValidColorInput,
  getRandomColorHex,
  applyColor,
  deletePeacocksColorCustomizations,
  getDarkenedColorHex,
  getLightenedColorHex,
} from './color-library';

import { State, peacockGreen } from './models';
import {
  getDarkenLightenPercentage,
  getRandomFavoriteColor,
  getSurpriseMeFromFavoritesOnly,
  updateWorkspaceConfiguration,
  addNewFavoriteColor,
  writeRecommendedFavoriteColors,
  updatePeacockColor,
  getEnvironmentAwareColor,
  updatePeacockRemoteColor,
} from './configuration';
import { promptForColor, promptForFavoriteColor, promptForFavoriteColorName } from './inputs';

import { resetLiveSharePreviousColors } from './live-share';
import { resetFavoritesVersionMemento } from './mementos';
import { notify } from './notification';
import { clearStatusBar } from './statusbar';
import * as vscode from 'vscode';

export async function resetColorsHandler() {
  const colorCustomizations = deletePeacocksColorCustomizations();
  const newColorCustomizations = isObjectEmpty(colorCustomizations)
    ? undefined
    : colorCustomizations;

  await resetLiveSharePreviousColors();
  await resetFavoritesVersionMemento();

  await updateWorkspaceConfiguration(newColorCustomizations);
  await updatePeacockColor('');
  await updatePeacockRemoteColor('');

  clearStatusBar();

  return State.extensionContext;
}

export async function saveColorToFavoritesHandler() {
  const color = getEnvironmentAwareColor();
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
  await applyColor(input);
  return State.extensionContext;
}

export async function changeColorToRandomHandler() {
  let surpriseMeFromFavoritesOnly = getSurpriseMeFromFavoritesOnly();
  let color = '';

  if (surpriseMeFromFavoritesOnly) {
    const o = getRandomFavoriteColor();
    if (!o) {
      notify(
        'No favorites exist. Add some favorites if you want to use the surprise me from favorites feature',
      );
      return State.extensionContext;
    }
    color = o.value;
  } else {
    color = getRandomColorHex();
  }

  await applyColor(color);
  return State.extensionContext;
}

export async function addRecommendedFavoritesHandler() {
  await writeRecommendedFavoriteColors();
  return State.extensionContext;
}

export async function changeColorToPeacockGreenHandler() {
  await applyColor(peacockGreen);
  return State.extensionContext;
}

export async function changeColorToFavoriteHandler() {
  const input = await promptForFavoriteColor();
  if (isValidColorInput(input)) {
    await applyColor(input);
  }
  return State.extensionContext;
}

export async function darkenHandler() {
  const color = getEnvironmentAwareColor();
  const darkenLightenPercentage = getDarkenLightenPercentage();
  const darkenedColor = getDarkenedColorHex(color, darkenLightenPercentage);
  await applyColor(darkenedColor);
  return State.extensionContext;
}

export async function lightenHandler() {
  const color = getEnvironmentAwareColor();
  const darkenLightenPercentage = getDarkenLightenPercentage();
  const lightenedColor = getLightenedColorHex(color, darkenLightenPercentage);
  await applyColor(lightenedColor);
  return State.extensionContext;
}

export async function showAndCopyCurrentColorHandler() {
  const color = getEnvironmentAwareColor();
  const msg = color
    ? `Peacock's color is ${color} and has been copied to your clipboard.`
    : 'There is no Peacock color set at this time.';
  vscode.env.clipboard.writeText(color);
  notify(msg, true);
  return State.extensionContext;
}

function isObjectEmpty(o: {}) {
  return !Object.keys(o).length;
}
