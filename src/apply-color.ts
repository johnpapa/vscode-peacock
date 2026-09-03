import * as vscode from 'vscode';

import { ColorSettings, extensionShortName, ISettingsIndexer } from './models';
import {
  getColorCustomizationConfigFromWorkspace,
  prepareColors,
  updateWorkspaceConfiguration,
  updatePeacockColor,
  updatePeacockRemoteColor,
  getExcludedSettings,
} from './configuration';
import { Logger } from './logging';
import { updateStatusBar } from './statusbar';
import {
  isValidColorInput,
  getBackgroundColorHex,
  deletePeacocksColorCustomizations,
} from './color-library';
import { notify } from './notification';

export interface IColorRenderer {
  apply(color: string): Promise<string | undefined>;
  unapply(): Promise<void>;
  capture(): Promise<unknown>;
  restore(state: unknown): Promise<void>;
  getSideBarBackground(): string | undefined;
  updateSideBarBackground(color: string | undefined): Promise<void>;
}

export interface IColorPersistence {
  save(color: string): Promise<void>;
  clearWorkspace(): Promise<void>;
}

const modernUICompatibilityNotice =
  "Peacock colors are not visible because VS Code's experimental workbench.experimental.modernUI overrides workbench color customizations. Disable that setting to restore Peacock colors. Tracking issue: https://github.com/johnpapa/vscode-peacock/issues/652";
let modernUICompatibilityNoticeShown = false;

function showModernUICompatibilityNoticeIfNeeded() {
  if (modernUICompatibilityNoticeShown) {
    return;
  }

  const modernUIEnabled = vscode.workspace
    .getConfiguration('workbench')
    .get<boolean>('experimental.modernUI', false);

  if (!modernUIEnabled) {
    return;
  }

  modernUICompatibilityNoticeShown = true;
  notify(modernUICompatibilityNotice, true);
}

export function resetModernUICompatibilityNoticeForTests() {
  modernUICompatibilityNoticeShown = false;
}

async function unapplyWorkspaceSettingsColors() {
  if (!vscode.workspace.workspaceFolders) {
    // If we are not in a workspace, don't allow Peacock to apply colors or write to settings.
    return;
  }

  // Overwite color customizations, without the peacock ones.
  // This preserves any extra ones someone might have.
  const excludedSettings = getExcludedSettings();
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

  const excludedSettings = getExcludedSettings();

  /**
   * If any existing color settings are not in the set
   * that Peacock manages, remove them.
   * Excluded settings are never stripped.
   */
  Object.values(ColorSettings)
    .filter(c => !(c in updatedColors))
    .filter(c => !excludedSettings.includes(c))
    .forEach(c => delete existingColorsClone[c]);

  /**
   * Filter out any settings that the user has specifically excluded so
   * Peacock does not overwrite them with new values.
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

async function applyWorkspaceSettingsColor(input: string) {
  /**************************************************************
   * This is the heart of Peacock logic to apply the colors.
   *
   */

  if (!vscode.workspace.workspaceFolders) {
    // If we are not in a workspace, don't allow Peacock to apply colors or write to settings.
    return;
  }

  if (!isValidColorInput(input)) {
    await unapplyWorkspaceSettingsColors();
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
  showModernUICompatibilityNoticeIfNeeded();

  return color;
}

const workspaceSettingsRenderer: IColorRenderer = {
  apply: applyWorkspaceSettingsColor,
  unapply: unapplyWorkspaceSettingsColors,

  async capture() {
    return { ...getColorCustomizationConfigFromWorkspace() };
  },

  async restore(state: unknown) {
    await updateWorkspaceConfiguration(state as ISettingsIndexer | undefined);
    updateStatusBar();
  },

  getSideBarBackground() {
    return getColorCustomizationConfigFromWorkspace()['sideBar.background'];
  },

  async updateSideBarBackground(color: string | undefined) {
    const colorCustomizations = { ...getColorCustomizationConfigFromWorkspace() };
    if (color) {
      colorCustomizations['sideBar.background'] = color;
    } else {
      delete colorCustomizations['sideBar.background'];
    }
    await updateWorkspaceConfiguration(colorCustomizations);
  },
};

const workspaceSettingsPersistence: IColorPersistence = {
  async save(color: string) {
    if (vscode.env.remoteName) {
      await updatePeacockRemoteColor(color);
    } else {
      await updatePeacockColor(color);
    }
  },

  async clearWorkspace() {
    await updatePeacockColor(undefined);
    await updatePeacockRemoteColor(undefined);
  },
};

let activeRenderer = workspaceSettingsRenderer;
let activePersistence = workspaceSettingsPersistence;

export function configureColorApplication(
  renderer: IColorRenderer = workspaceSettingsRenderer,
  persistence: IColorPersistence = workspaceSettingsPersistence,
) {
  activeRenderer = renderer;
  activePersistence = persistence;
}

export function resetColorApplicationForTests() {
  configureColorApplication();
}

export async function unapplyColors() {
  if (!vscode.workspace.workspaceFolders) {
    return;
  }
  await activeRenderer.unapply();
}

export async function applyColor(input: string) {
  if (!vscode.workspace.workspaceFolders) {
    return;
  }

  if (!isValidColorInput(input)) {
    await unapplyColors();
    return;
  }

  const color = getBackgroundColorHex(input);
  const appliedColor = await activeRenderer.apply(color);
  Logger.info(`${extensionShortName}: Peacock is now using ${color}`);
  return appliedColor;
}

export async function updateColorSetting(color: string) {
  if (!vscode.workspace.workspaceFolders) {
    // If we are not in a workspace, don't allow Peacock to apply colors or write to settings.
    return;
  }

  if (!color) {
    return;
  }

  await activePersistence.save(color);
}

export async function clearWorkspaceColorSettings() {
  if (!vscode.workspace.workspaceFolders) {
    return;
  }
  await activePersistence.clearWorkspace();
}

export async function captureColorRenderState() {
  return await activeRenderer.capture();
}

export async function restoreColorRenderState(state: unknown) {
  await activeRenderer.restore(state);
}

export function getRenderedSideBarBackground() {
  return activeRenderer.getSideBarBackground();
}

export async function updateRenderedSideBarBackground(color: string | undefined) {
  await activeRenderer.updateSideBarBackground(color);
}
