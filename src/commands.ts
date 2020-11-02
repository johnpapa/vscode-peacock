import {
  isValidColorInput,
  getRandomColorHex,
  getDarkenedColorHex,
  getLightenedColorHex,
} from './color-library';
import { applyColor, unapplyColors, updateColorSetting } from './apply-color';
import { State, peacockGreen, docsUri } from './models';
import {
  getDarkenLightenPercentage,
  getRandomFavoriteColor,
  getSurpriseMeFromFavoritesOnly,
  addNewFavoriteColor,
  writeRecommendedFavoriteColors,
  updatePeacockColor,
  getEnvironmentAwareColor,
  updatePeacockRemoteColor,
  updatePeacockRemoteColorInUserSettings,
  updatePeacockColorInUserSettings,
} from './configuration';
import { promptForColor, promptForFavoriteColor, promptForFavoriteColorName } from './inputs';

import { resetLiveSharePreviousColors } from './live-share';
import { notify } from './notification';
import * as vscode from 'vscode';
import { ExtensionContext } from 'vscode';

export async function removeAllPeacockColorsHandler(): Promise<ExtensionContext> {
  await resetWorkspaceColorsHandler();
  await updatePeacockColorInUserSettings(undefined);
  await updatePeacockRemoteColorInUserSettings(undefined);
  return State.extensionContext;
}

export async function showDocumentationHandler(): Promise<ExtensionContext> {
  await vscode.env.openExternal(docsUri);
  return State.extensionContext;
}

export async function resetWorkspaceColorsHandler(): Promise<ExtensionContext> {
  await resetLiveSharePreviousColors();
  await updatePeacockColor(undefined);
  await updatePeacockRemoteColor(undefined);
  return State.extensionContext;
}

export async function saveColorToFavoritesHandler(): Promise<ExtensionContext> {
  const color = getEnvironmentAwareColor();
  if (color) {
    const name = await promptForFavoriteColorName(color);
    if (!name) {
      return State.extensionContext;
    }
    await addNewFavoriteColor(name, color);
  }
  return State.extensionContext;
}

export async function enterColorHandler(color?: string): Promise<ExtensionContext> {
  const input = color ? color : await promptForColor();
  if (!input) {
    return State.extensionContext;
  }
  if (!isValidColorInput(input)) {
    throw new Error(`Invalid HEX or named color "${input}"`);
  }
  await applyColor(input);
  await updateColorSetting(input);
  return State.extensionContext;
}

export async function changeColorToRandomHandler(): Promise<ExtensionContext> {
  const surpriseMeFromFavoritesOnly = getSurpriseMeFromFavoritesOnly();
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

export async function addRecommendedFavoritesHandler(): Promise<ExtensionContext> {
  await writeRecommendedFavoriteColors();
  return State.extensionContext;
}

export async function changeColorToPeacockGreenHandler(): Promise<ExtensionContext> {
  await applyColor(peacockGreen);
  await updateColorSetting(peacockGreen);
  return State.extensionContext;
}

export async function changeColorToFavoriteHandler(): Promise<ExtensionContext> {
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

export async function darkenHandler(): Promise<ExtensionContext> {
  const color = getEnvironmentAwareColor();
  if (color) {
    const darkenLightenPercentage = getDarkenLightenPercentage();
    const darkenedColor = getDarkenedColorHex(color, darkenLightenPercentage);
    await applyColor(darkenedColor);
    await updateColorSetting(darkenedColor);
  }
  return State.extensionContext;
}

export async function lightenHandler(): Promise<ExtensionContext> {
  const color = getEnvironmentAwareColor();
  if (color) {
    const darkenLightenPercentage = getDarkenLightenPercentage();
    const lightenedColor = getLightenedColorHex(color, darkenLightenPercentage);
    await applyColor(lightenedColor);
    await updateColorSetting(lightenedColor);
  }
  return State.extensionContext;
}

export async function showAndCopyCurrentColorHandler(): Promise<ExtensionContext> {
  const color = getEnvironmentAwareColor();
  if (!color) {
    return State.extensionContext;
  }
  const msg = color
    ? `Peacock's color is ${color} and has been copied to your clipboard.`
    : 'There is no Peacock color set at this time.';
  vscode.env.clipboard.writeText(color);
  notify(msg, true);
  return State.extensionContext;
}
