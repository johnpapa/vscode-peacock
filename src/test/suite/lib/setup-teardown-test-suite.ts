import {
  IPeacockSettings,
  IPeacockAffectedElementSettings,
  Commands,
  ForegroundColors,
  starterSetOfFavorites,
  getExtension
} from '../../../models';
import {
  getAffectedElements,
  getFavoriteColors,
  updateFavoriteColors,
  updateElementAdjustments,
  updateKeepForegroundColor,
  getKeepForegroundColor,
  updateSurpriseMeOnStartup,
  getDarkForegroundColor,
  getLightForegroundColor,
  updateDarkForegroundColor,
  updateLightForegroundColor,
  updateAffectedElements,
  updateSurpriseMeFromFavoritesOnly,
  getSurpriseMeFromFavoritesOnly
} from '../../../configuration';

import { noopElementAdjustments, executeCommand } from './constants';

export async function setupTest() {
  await executeCommand(Commands.resetColors);
}

export async function setupTestSuite(
  // extension: vscode.Extension<any> | undefined,
  originalValues: IPeacockSettings
) {
  let extension = getExtension();

  // Save the original values
  originalValues.affectedElements = getAffectedElements();
  originalValues.keepForegroundColor = getKeepForegroundColor();
  const { values: favoriteColors } = getFavoriteColors();
  originalValues.favoriteColors = favoriteColors;
  originalValues.darkForegroundColor = getDarkForegroundColor();
  originalValues.lightForegroundColor = getLightForegroundColor();
  originalValues.surpriseMeFromFavoritesOnly = getSurpriseMeFromFavoritesOnly();

  // Set the test values
  await updateAffectedElements(<IPeacockAffectedElementSettings>{
    statusBar: true,
    activityBar: true,
    titleBar: true
  });
  await updateFavoriteColors(starterSetOfFavorites);
  await updateKeepForegroundColor(false);
  await updateSurpriseMeOnStartup(false);
  await updateElementAdjustments(noopElementAdjustments);
  await updateDarkForegroundColor(ForegroundColors.DarkForeground);
  await updateLightForegroundColor(ForegroundColors.LightForeground);
  await updateSurpriseMeFromFavoritesOnly(false);
  return extension;
}

export async function teardownTestSuite(originalValues: IPeacockSettings) {
  await executeCommand(Commands.resetColors);

  // put back the original peacock user settings
  await updateAffectedElements(originalValues.affectedElements);
  await updateElementAdjustments(originalValues.elementAdjustments);
  await updateFavoriteColors(originalValues.favoriteColors);
  await updateKeepForegroundColor(originalValues.keepForegroundColor);
  await updateSurpriseMeOnStartup(originalValues.surpriseMeOnStartup);
  await updateDarkForegroundColor(originalValues.darkForegroundColor);
  await updateLightForegroundColor(originalValues.lightForegroundColor);
  await updateSurpriseMeFromFavoritesOnly(
    originalValues.surpriseMeFromFavoritesOnly
  );
}
