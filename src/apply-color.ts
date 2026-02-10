import * as vscode from 'vscode';

import { ColorSettings, extensionShortName, ISettingsIndexer, StandardSettings } from './models';
import {
  getColorCustomizationConfigFromWorkspace,
  prepareColors,
  updateWorkspaceConfiguration,
  updatePeacockColor,
  updatePeacockRemoteColor,
  readConfiguration,
} from './configuration';
import { Logger } from './logging';
import { updateStatusBar } from './statusbar';
import {
  isValidColorInput,
  getBackgroundColorHex,
  deletePeacocksColorCustomizations,
} from './color-library';
// import { ConfigurationTarget } from 'vscode';

export async function unapplyColors() {
  if (!vscode.workspace.workspaceFolders) {
    // If we are not in a workspace, don't allow Peacock to apply colors or write to settings.
    return;
  }

  // Overwite color customizations, without the peacock ones.
  // This preserves any extra ones someone might have.
  const excludedSettings = readConfiguration<string[]>(StandardSettings.ExcludedSettings, []);
  const colorCustomizationsWithPeacock = deletePeacocksColorCustomizations(excludedSettings);
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
  const existingColorsClone: ISettingsIndexer = { ...existingColors };

  /**
   * If any existing color settings are not in the set
   * that Peacock manages, remove them.
   */
  const excludedSettings = readConfiguration<string[]>(StandardSettings.ExcludedSettings, []);
  Object.values(ColorSettings)
    .filter(c => !(c in updatedColors))
    .filter(c => !excludedSettings.includes(c))
    .forEach(c => delete existingColorsClone[c]);

  /**
   * Filter out any settings that the user has specifically excluded.
   * This prevents Peacock from overwriting these settings with new values.
   */
  const filteredUpdatedColors: ISettingsIndexer = {};
  Object.keys(updatedColors).forEach(key => {
    if (!excludedSettings.includes(key)) {
      filteredUpdatedColors[key] = updatedColors[key];
    }
  });

  /**
   * Merge the updated colors on top of the existing colors.
   */
  const mergedCustomizations: ISettingsIndexer = {
    ...existingColorsClone,
    ...filteredUpdatedColors,
  };

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
