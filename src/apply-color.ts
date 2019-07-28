import * as vscode from 'vscode';

import { extensionShortName } from './models';
import {
  prepareColors,
  updateWorkspaceConfiguration,
  updatePeacockColor,
  updatePeacockRemoteColor,
  getEnvironmentAwareColor,
} from './configuration';
import { Logger } from './logging';
import { updateStatusBar } from './statusbar';
import {
  isValidColorInput,
  getBackgroundColorHex,
  deletePeacocksColorCustomizations,
} from './color-library';

export async function applyColor(input: string, trialMode = false) {
  /**************************************************************
   * This is the heart of Peacock logic to apply the colors.
   *
   */
  const colorInSettings = getEnvironmentAwareColor();

  // Blank is OK, as this means we'll remove
  // all peacock colors for the environment we are in.
  // Otherwise it must be a valid color.
  // if (input !== '' && !isValidColorInput(input)) {
  if (!isValidColorInput(input)) {
    // TODO: ^^^
    return;
  }

  // If it is blank, don't get a color.
  // const color = input === '' ? '' : getBackgroundColorHex(input);
  const color = getBackgroundColorHex(input);
  // TODO: ^^^

  // Delete all Peacock color customizations from the object
  // and return pre-existing color customizations (not Peacock ones)
  const existingColors = deletePeacocksColorCustomizations();

  // Get new Peacock colors.
  // If it is blank, don't prepare the colors
  // const newColors = input === '' ? undefined : prepareColors(color);
  const newColors = prepareColors(color);
  // TODO: ^^^

  // merge the existing colors with the new ones
  // order is important here, so our new colors overwrite the old ones
  const colorCustomizations: any = {
    ...existingColors,
    ...newColors,
  };

  // Write all of the custom of the colors to workspace settings
  await updateWorkspaceConfiguration(colorCustomizations);

  // If the color changed, write it to settings
  // TODO: need to this this 👇
  if (color !== colorInSettings) {
    await updateColorSetting(color, trialMode);
  }

  // Update the statusbar to show the color
  updateStatusBar();

  Logger.info(`${extensionShortName}: Peacock is now using ${color}`);

  return color;
}

export async function updateColorSetting(color: string, trialMode = false) {
  if (!trialMode) {
    if (vscode.env.remoteName) {
      await updatePeacockRemoteColor(color);
    } else {
      await updatePeacockColor(color);
    }
  }
}
