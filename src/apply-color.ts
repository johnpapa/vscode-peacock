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
  if (!vscode.workspace.workspaceFolders) {
    // If we are not in a workspace, don't allow Peacock to apply colors or write to settings.
    return;
  }

  // Overwrite color customizations, without the peacock ones.
  // This preserves any extra ones someone might have.
  const colorCustomizationsWithPeacock = deletePeacocksColorCustomizations();
  await updateWorkspaceConfiguration(colorCustomizationsWithPeacock);
  updateStatusBar();
}

export async function applyColor(input: string, updateWorkspaceConfig: boolean) {
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

  // Delete all Peacock color customizations from the object
  // and return pre-existing color customizations (not Peacock settings)
  const colorCustomizationsWithoutPeacock = deletePeacocksColorCustomizations();

  // Get new Peacock colors.
  const newColors = prepareColors(color);

  // merge the existing colors with the new ones
  // order is important here, so our new colors overwrite the old ones
  const colorCustomizations: any = {
    ...colorCustomizationsWithoutPeacock,
    ...newColors,
  };

  // Only update workspace config, when explicitly instructed.
  if (updateWorkspaceConfig) {
    await updateWorkspaceConfiguration(colorCustomizations);
  }

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
