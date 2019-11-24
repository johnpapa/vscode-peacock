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

function mergeColorCustomizations(existing: ISettingsIndexer, updated: ISettingsIndexer) {
  const mergedCustomizations = { ...existing };

  // Remove colors that are not set in updated.
  Object.values(ColorSettings)
    .filter(c => !(c in updated))
    .forEach(c => delete mergedCustomizations[c]);

  // Apply updated changes.
  Object.keys(updated)
    .sort()
    .forEach(c => (mergedCustomizations[c] = updated[c]));

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

  // Get new Peacock colors.
  const newColors = prepareColors(color);

  const colorCustomizations = mergeColorCustomizations(existingColors, newColors);

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
