import * as vscode from 'vscode';

import { ColorSettings, extensionShortName, ISettingsIndexer, StandardSettings } from './models';
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
import { ConfigurationTarget } from 'vscode';

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
  const existingColorsClone: ISettingsIndexer = { ...existingColors };

  /**
   * If any existing color settings are not in the set
   * that Peacock manages, remove them.
   */
  Object.values(ColorSettings)
    .filter(c => !(c in updatedColors))
    .forEach(c => delete existingColorsClone[c]);

  /**
   * Merge the updated colors on top of the existing colors.
   */
  const mergedCustomizations: ISettingsIndexer = {
    ...existingColorsClone,
    ...updatedColors,
  };

  return mergedCustomizations;
}

// async function bustTheCache() {
//   /**
//    * Workaround: The following code forces VS Code to read the
//    * workspace configuration fresh from the disk.
//    * We change a value in the workspace (peacock.cacheBust),
//    * which forces VS Code to read it again next time.
//    *
//    * If VS Code either stops caching or implements a way to
//    * bust the cache so we can read the workspace configuration
//    * fresh from the disk, then we can remove this code
//    *
//    * See github issue https://github.com/microsoft/vscode/issues/92733
//    */
//   const config = vscode.workspace.getConfiguration();
//   const section = `${extensionShortName}.${StandardSettings.CacheBust}`;
//   const cachebuster = Math.floor(Math.random() * Math.floor(1000000)).toString();
//   await config.update(section, cachebuster, ConfigurationTarget.Workspace);
// }

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

  // Write a value to the workspace.
  // await bustTheCache();

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
