import * as vscode from 'vscode';

import { extensionShortName } from './models';
import {
  prepareColors,
  updateWorkspaceConfiguration,
  updatePeacockColor,
  updatePeacockRemoteColor,
} from './configuration';
import { Logger } from './logging';
import { updateStatusBar } from './statusbar';
import {
  isValidColorInput,
  getBackgroundColorHex,
  deletePeacocksColorCustomizations,
} from './color-library';

export async function unapplyColors() {
  // Overwite color customizations, without the peacock ones.
  // This preserves any extra ones someone might have.
  const existingColors = deletePeacocksColorCustomizations();
  await updateWorkspaceConfiguration(existingColors);
  // Hide the status bar
  updateStatusBar();
}

export async function applyColor(input: string) {
  /**************************************************************
   * This is the heart of Peacock logic to apply the colors.
   *
   */

  if (!isValidColorInput(input)) {
    return;
  }

  const color = getBackgroundColorHex(input);

  // Delete all Peacock color customizations from the object
  // and return pre-existing color customizations (not Peacock settings)
  const existingColors = deletePeacocksColorCustomizations();

  // Get new Peacock colors.
  const newColors = prepareColors(color);

  // merge the existing colors with the new ones
  // order is important here, so our new colors overwrite the old ones
  const colorCustomizations: any = {
    ...existingColors,
    ...newColors,
  };

  // Write all of the custom of the colors to workspace settings
  await updateWorkspaceConfiguration(colorCustomizations);

  updateStatusBar();

  Logger.info(`${extensionShortName}: Peacock is now using ${color}`);

  return color;
}

export async function updateColorSetting(color: string) {
  if (!color) {
    return;
  }

  if (vscode.env.remoteName) {
    await updatePeacockRemoteColor(color);
  } else {
    await updatePeacockColor(color);
  }
}
