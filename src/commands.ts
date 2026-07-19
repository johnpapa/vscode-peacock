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
  updateWorkspaceConfiguration,
  getColorCustomizationConfigFromWorkspace,
} from './configuration';
import { promptForColor, promptForFavoriteColor, promptForFavoriteColorName } from './inputs';
import {
  resolveFavoriteSelectionAction,
  canSaveFavoriteColor,
  getSideBarDarknessOptions,
  getSideBarDarkenedColor,
} from './commands-helpers';

import { resetLiveSharePreviousColors } from './live-share';
import { notify } from './notification';
import * as vscode from 'vscode';

export async function removeAllPeacockColorsHandler() {
  await resetWorkspaceColorsHandler();
  await updatePeacockColorInUserSettings(undefined);
  await updatePeacockRemoteColorInUserSettings(undefined);
  return State.extensionContext;
}

export async function showDocumentationHandler() {
  await vscode.env.openExternal(docsUri);
  return State.extensionContext;
}

export async function resetWorkspaceColorsHandler() {
  await resetLiveSharePreviousColors();
  await unapplyColors();
  await updatePeacockColor(undefined);
  await updatePeacockRemoteColor(undefined);
  return State.extensionContext;
}

export async function saveColorToFavoritesHandler() {
  const color = getEnvironmentAwareColor();
  if (color) {
    const name = await promptForFavoriteColorName(color);
    if (!canSaveFavoriteColor(color, name)) {
      return;
    }
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
  const action = resolveFavoriteSelectionAction(favoriteColor, startingColor, isValidColorInput);

  if (action.action === 'unapply') {
    // No favorite was selected. We had no color to start, either.
    // We need re unapply the colors, and NOT write a color to settings.
    await unapplyColors();
    return State.extensionContext;
  }

  if (action.color) {
    await applyColor(action.color);
    await updateColorSetting(action.color);
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

export async function setSideBarDarknessLevelHandler() {
  try {
    const color = getEnvironmentAwareColor();
    if (!color) {
      return;
    }

    const sideBarBackgroundKey = 'sideBar.background';
    const colorCustomizations = { ...getColorCustomizationConfigFromWorkspace() };
    const existingSideBarColor = colorCustomizations[sideBarBackgroundKey];

    const options = getSideBarDarknessOptions(existingSideBarColor);

    const selection = await vscode.window.showQuickPick(
      options.map(o => o.label),
      {
        placeHolder: 'Select SideBar darkness level',
      },
    );

    if (!selection) {
      return;
    }

    if (selection === 'Remove Side Bar Color') {
      delete colorCustomizations[sideBarBackgroundKey];
      await updateWorkspaceConfiguration(colorCustomizations);
      notify('SideBar background color has been removed.', true);
      return;
    }

    const selected = options.find(o => o.label === selection);
    if (!selected) {
      return;
    }

    const newColor = getSideBarDarkenedColor(color, selected.factor);

    colorCustomizations[sideBarBackgroundKey] = newColor;
    await updateWorkspaceConfiguration(colorCustomizations);
    notify(`SideBar background set to ${selection} (${newColor})`, true);
  } catch (err) {
    notify(`Failed to set SideBar darkness: ${err}`, true);
  }
}
