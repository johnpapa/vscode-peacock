import {
  getAffectedElements,
  getDarkForegroundColor,
  getFavoriteColors,
  getKeepBadgeColor,
  getKeepForegroundColor,
  getLightForegroundColor,
  getPeacockColor,
  getPeacockRemoteColor,
  getShowColorInStatusBar,
  getSurpriseMeFromFavoritesOnly,
  updateAffectedElements,
  updateDarkForegroundColor,
  updateElementAdjustments,
  updateFavoriteColors,
  updateKeepBadgeColor,
  updateKeepForegroundColor,
  updateLightForegroundColor,
  updatePeacockColor,
  updatePeacockRemoteColor,
  updateShowColorInStatusBar,
  updateSurpriseMeFromFavoritesOnly,
  updateSurpriseMeOnStartup,
} from '../../../configuration';
import {
  Commands,
  ForegroundColors,
  IPeacockSettings,
  starterSetOfFavorites,
} from '../../../models';

import { getExtension } from '../../../models/extension';
import { allAffectedElements, executeCommand, noopElementAdjustments } from './constants';

export async function setupTest() {
  await executeCommand(Commands.resetWorkspaceColors);
}

export async function setupTestSuite(
  // extension: vscode.Extension<any> | undefined,
  originalValues: IPeacockSettings,
) {
  const extension = getExtension();

  // Save the original values
  originalValues.affectedElements = getAffectedElements();
  originalValues.keepForegroundColor = getKeepForegroundColor();
  const { values: favoriteColors } = getFavoriteColors();
  originalValues.favoriteColors = favoriteColors;
  originalValues.darkForegroundColor = getDarkForegroundColor();
  originalValues.lightForegroundColor = getLightForegroundColor();
  originalValues.keepBadgeColor = getKeepBadgeColor();
  originalValues.surpriseMeFromFavoritesOnly = getSurpriseMeFromFavoritesOnly();
  originalValues.showColorInStatusBar = getShowColorInStatusBar();
  originalValues.color = getPeacockColor();
  originalValues.remoteColor = getPeacockRemoteColor();

  // Set the test values
  await updateAffectedElements(allAffectedElements);
  await updateFavoriteColors(starterSetOfFavorites);
  await updateKeepForegroundColor(false);
  await updateSurpriseMeOnStartup(false);
  await updateElementAdjustments(noopElementAdjustments);
  await updateDarkForegroundColor(ForegroundColors.DarkForeground);
  await updateLightForegroundColor(ForegroundColors.LightForeground);
  await updateKeepBadgeColor(false);
  await updateSurpriseMeFromFavoritesOnly(false);
  await updateShowColorInStatusBar(true);
  await updatePeacockColor(undefined);
  await updatePeacockRemoteColor(undefined);
  return extension;
}

export async function teardownTestSuite(originalValues: IPeacockSettings) {
  await executeCommand(Commands.resetWorkspaceColors);

  // put back the original peacock user settings

  await updateAffectedElements(originalValues.affectedElements);
  await updateElementAdjustments(originalValues.elementAdjustments);
  await updateFavoriteColors(originalValues.favoriteColors);
  await updateKeepForegroundColor(originalValues.keepForegroundColor);
  await updateDarkForegroundColor(originalValues.darkForegroundColor);
  await updateLightForegroundColor(originalValues.lightForegroundColor);
  await updateKeepBadgeColor(originalValues.keepBadgeColor);
  await updateSurpriseMeFromFavoritesOnly(originalValues.surpriseMeFromFavoritesOnly);
  await updateSurpriseMeOnStartup(originalValues.surpriseMeOnStartup);
  await updateShowColorInStatusBar(originalValues.showColorInStatusBar);
  await updatePeacockColor(originalValues.color);
  await updatePeacockRemoteColor(originalValues.remoteColor);
}
