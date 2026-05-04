import {
  IPeacockSettings,
  Commands,
  ForegroundColors,
  starterSetOfFavorites,
  getExtension,
} from '../../../models';
import {
  getAffectedElements,
  getFavoriteColors,
  updateFavoriteColors,
  updateElementAdjustments,
  updateKeepForegroundColor,
  getKeepForegroundColor,
  getSurpriseMeOnStartup,
  updateSurpriseMeOnStartup,
  getDeterministicOnStartup,
  updateDeterministicOnStartup,
  getDarkForegroundColor,
  getLightForegroundColor,
  updateDarkForegroundColor,
  updateLightForegroundColor,
  updateAffectedElements,
  updateSurpriseMeFromFavoritesOnly,
  getSurpriseMeFromFavoritesOnly,
  getShowColorInStatusBar,
  updateShowColorInStatusBar,
  getPeacockColor,
  getPeacockRemoteColor,
  updatePeacockColor,
  updatePeacockRemoteColor,
  getKeepBadgeColor,
  updateKeepBadgeColor,
} from '../../../configuration';

import { noopElementAdjustments, executeCommand, allAffectedElements } from './constants';

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
  originalValues.deterministicOnStartup = getDeterministicOnStartup();
  originalValues.surpriseMeOnStartup = getSurpriseMeOnStartup();

  // Set the test values
  await updateAffectedElements(allAffectedElements);
  await updateFavoriteColors(starterSetOfFavorites);
  await updateKeepForegroundColor(false);
  await updateSurpriseMeOnStartup(false);
  await updateDeterministicOnStartup(false);
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
  await updateDeterministicOnStartup(originalValues.deterministicOnStartup);
  await updateShowColorInStatusBar(originalValues.showColorInStatusBar);
  await updatePeacockColor(originalValues.color);
  await updatePeacockRemoteColor(originalValues.remoteColor);
}
