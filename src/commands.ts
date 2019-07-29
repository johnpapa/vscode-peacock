import {
  isValidColorInput,
  getRandomColorHex,
  deletePeacocksColorCustomizations,
  getDarkenedColorHex,
  getLightenedColorHex,
} from './color-library';
import { applyColor, unapplyColors, updateColorSetting } from './apply-color';
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
  await updatePeacockColor(undefined);
  await updatePeacockRemoteColor(undefined);

  clearStatusBar();

  return State.extensionContext;
}

export async function saveColorToFavoritesHandler() {
  const color = getEnvironmentAwareColor();
  if (color) {
    const name = await promptForFavoriteColorName(color);
    if (!name) {
      return;
    }
    await addNewFavoriteColor(name, color);
  }
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
  await updateColorSetting(input);
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
  await updateColorSetting(color);
  return State.extensionContext;
}

export async function addRecommendedFavoritesHandler() {
  await writeRecommendedFavoriteColors();
  return State.extensionContext;
}

export async function changeColorToPeacockGreenHandler() {
  await applyColor(peacockGreen);
  await updateColorSetting(peacockGreen);
  return State.extensionContext;
}

export async function changeColorToFavoriteHandler() {
  // Remember the color we started with
  const startingColor = getEnvironmentAwareColor();
  const favoriteColor = await promptForFavoriteColor();

  if (isValidColorInput(favoriteColor)) {
    // We have a valid Favorite color,
    // apply it and write the new color to settings
    await applyColor(favoriteColor);
    await updateColorSetting(favoriteColor);
  } else if (startingColor) {
    // No favorite was selected.
    // We need to re-apply the starting color
    // and write the new color to settings
    await applyColor(startingColor);
    await updateColorSetting(startingColor);
  } else {
    // No favorite was selected. We had no color to start, either.
    // We need re unapply the colors, and NOT write a color to settings.
    await unapplyColors();
  }
  return State.extensionContext;
}

export async function darkenHandler() {
  const color = getEnvironmentAwareColor();
  if (color) {
    const darkenLightenPercentage = getDarkenLightenPercentage();
    const darkenedColor = getDarkenedColorHex(color, darkenLightenPercentage);
    await applyColor(darkenedColor);
    await updateColorSetting(darkenedColor);
  }
  return State.extensionContext;
}

export async function lightenHandler() {
  const color = getEnvironmentAwareColor();
  if (color) {
    const darkenLightenPercentage = getDarkenLightenPercentage();
    const lightenedColor = getLightenedColorHex(color, darkenLightenPercentage);
    await applyColor(lightenedColor);
    await updateColorSetting(lightenedColor);
  }
  return State.extensionContext;
}

export async function showAndCopyCurrentColorHandler() {
  const color = getEnvironmentAwareColor();
  if (!color) {
    return;
  }
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
