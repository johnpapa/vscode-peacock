import {
  IPeacockSettings,
  IPeacockAffectedElementSettings,
  Commands,
  ForegroundColors,
  starterSetOfFavorites
} from '../../models';
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
  updateLightForegroundColor
} from '../../configuration';

import { getExtension, updateAffectedElements } from './helpers';
import { noopElementAdjustments, executeCommand } from './constants';

export function allSetupAndTeardown(originalValues: IPeacockSettings) {
  suiteSetup(async () => {
    await setupTestSuite(originalValues);
  });
  suiteTeardown(() => teardownTestSuite(originalValues));
  setup(async () => {
    await executeCommand(Commands.resetColors);
  });
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
}
