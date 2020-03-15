import * as vscode from 'vscode';

import { ColorSettings, extensionShortName, ISettingsIndexer } from './models';
import {
  getColorCustomizationConfigFromWorkspace,
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
  if (!vscode.workspace.workspaceFolders) {
    // If we are not in a workspace, don't allow Peacock to apply colors or write to settings.
    return;
  }

  // Overwite color customizations, without the peacock ones.
  // This preserves any extra ones someone might have.
  const colorCustomizationsWithPeacock = deletePeacocksColorCustomizations();
  await updateWorkspaceConfiguration(colorCustomizationsWithPeacock);
  updateStatusBar();
}

function mergeColorCustomizations(
  existingColors: ISettingsIndexer,
  updatedColors: ISettingsIndexer,
) {
  /**
   * Alays start with the existing colors.
   * So we clone existing into a new object that will contain
   * the merged (existing and updated) set of colors.
   */
  const mergedCustomizations = { ...existingColors };

  // Remove colors that are not set in updated.
  /**
   * If any existing color settings are not in the set
   * that Peacock manages, remove them from this
   * merged color set.
   * This preserves the order that they are currently in.
   */
  Object.values(ColorSettings)
    .filter(c => !(c in updatedColors))
    .forEach(c => delete mergedCustomizations[c]);

  /**
   * Loop through all updated color settings,
   * in the same order they are in currently.
   * Where there is a match between existing and udpated colors,
   * use the updated color.
   */
  Object.keys(updatedColors).forEach(c => (mergedCustomizations[c] = updatedColors[c]));

  return mergedCustomizations;
}

export async function applyColor(input: string) {
  /**************************************************************
   * This is the heart of Peacock logic to apply the colors.
   *
   */

  if (!vscode.workspace.workspaceFolders) {
    // If we are not in a workspace, don't allow Peacock to apply colors or write to settings.
    return;
  }

  if (!isValidColorInput(input)) {
    await unapplyColors();
    return;
  }

  const color = getBackgroundColorHex(input);

  // Get existing color customizations.
  const existingColors = getColorCustomizationConfigFromWorkspace();

  // Get updated Peacock colors.
  const updatedColors = prepareColors(color);

  const colorCustomizations = mergeColorCustomizations(existingColors, updatedColors);

  await updateWorkspaceConfiguration(colorCustomizations);
  updateStatusBar();

  Logger.info(`${extensionShortName}: Peacock is now using ${color}`);

  return color;
}

export async function updateColorSetting(color: string) {
  if (!vscode.workspace.workspaceFolders) {
    // If we are not in a workspace, don't allow Peacock to apply colors or write to settings.
    return;
  }

  if (!color) {
    return;
  }

  if (vscode.env.remoteName) {
    await updatePeacockRemoteColor(color);
  } else {
    await updatePeacockColor(color);
  }
}
