import * as vscode from 'vscode';
import { ConfigurationTarget } from 'vscode';
import {
  extensionShortName,
  AllSettings,
  Sections,
  IPeacockElementAdjustments,
  StandardSettings,
  IFavoriteColors,
  IPeacockAffectedElementSettings,
  AffectedSettings,
  starterSetOfFavorites,
  isObjectEmpty,
} from '../models';
import { Logger } from '../logging';
import { getFavoriteColors, getColorCustomizationConfigFromWorkspace,getSameRemoteLocalColor } from './read-configuration';
import { LiveShareSettings } from '../live-share';

export async function updateGlobalConfiguration(setting: AllSettings, value?: any) {
  const config = vscode.workspace.getConfiguration();
  const section = `${extensionShortName}.${setting}`;
  Logger.info(`${extensionShortName}: Updating the user settings with the following changes:`);
  if (value && Array.isArray(value) && value.length > 0) {
    Logger.info(value, true, `${extensionShortName}:  ${section}`);
  } else {
    Logger.info(`${extensionShortName}: ${section} = ${value}`, true);
  }
  return await config.update(section, value, ConfigurationTarget.Global);
}

export async function updateWorkspaceConfiguration(colorCustomizations: {} | undefined) {
  if (isObjectEmpty(colorCustomizations)) {
    // We are receiving an empty object, so let's make it undefined.
    // This means we can skip writing the workbench.colorCustomizations section
    // if one doesn't already exist.
    colorCustomizations = undefined;
  }

  if (!colorCustomizations) {
    // If it is undefined and the file doesn't exist, let's just get out.
    // Otherwise, we risk writing an empty file, which is annoying.
    const existingWorkspace = getColorCustomizationConfigFromWorkspace();
    if (isObjectEmpty(existingWorkspace)) {
      return;
    }
  }

  Logger.info(
    `${extensionShortName}: Updating the workspace with the following color customizations`,
  );
  Logger.info(colorCustomizations, true);
  return await vscode.workspace
    .getConfiguration()
    .update(
      Sections.peacockColorCustomizationSection,
      colorCustomizations,
      ConfigurationTarget.Workspace,
    );
}

export async function updateElementAdjustments(adjustments: IPeacockElementAdjustments) {
  return await updateGlobalConfiguration(StandardSettings.ElementAdjustments, adjustments);
}

export async function updateKeepForegroundColor(value: boolean) {
  return await updateGlobalConfiguration(StandardSettings.KeepForegroundColor, value);
}

export async function updateKeepBadgeColor(value: boolean) {
  return await updateGlobalConfiguration(StandardSettings.KeepBadgeColor, value);
}

export async function updateSurpriseMeOnStartup(value: boolean) {
  return await updateGlobalConfiguration(StandardSettings.SurpriseMeOnStartup, value);
}

export async function updateDarkForegroundColor(value: string) {
  return await updateGlobalConfiguration(StandardSettings.DarkForegroundColor, value);
}

export async function updateLightForegroundColor(value: string) {
  return await updateGlobalConfiguration(StandardSettings.LightForegroundColor, value);
}

export async function updateDarkenLightenPercentage(value: number) {
  return await updateGlobalConfiguration(StandardSettings.DarkenLightenPercentage, value);
}

export async function updateShowColorInStatusBar(value: boolean) {
  return await updateGlobalConfiguration(StandardSettings.ShowColorInStatusBar, value);
}

export async function updateSurpriseMeFromFavoritesOnly(value: boolean) {
  return await updateGlobalConfiguration(StandardSettings.SurpriseMeFromFavoritesOnly, value);
}

export async function addNewFavoriteColor(name: string, value: string) {
  const { values: favoriteColors } = getFavoriteColors();
  const newFavoriteColors = [...favoriteColors, { name, value }];
  return await updateFavoriteColors(newFavoriteColors);
}

export async function writeRecommendedFavoriteColors(overrideFavorites?: IFavoriteColors[]) {
  const newFavoriteColors = removeDuplicatesToStarterSet(overrideFavorites);
  return await updateFavoriteColors(newFavoriteColors);
}

export async function updateFavoriteColors(values: IFavoriteColors[]) {
  return await updateGlobalConfiguration(StandardSettings.FavoriteColors, values);
}

export async function updatePeacockColorInUserSettings(color: string | undefined) {
  const config = vscode.workspace.getConfiguration();
  const section = `${extensionShortName}.${StandardSettings.Color}`;
  return await config.update(section, color, ConfigurationTarget.Global);
}

export async function updatePeacockRemoteColorInUserSettings(color: string | undefined) {
  const config = vscode.workspace.getConfiguration();
  const section = `${extensionShortName}.${StandardSettings.RemoteColor}`;
  return await config.update(section, color, ConfigurationTarget.Global);
}
export async function updatePeacockColorOnly(color: string | undefined ) {
  const config = vscode.workspace.getConfiguration();
  const section = `${extensionShortName}.${StandardSettings.Color}`;
  return await config.update(section, color, ConfigurationTarget.Workspace);
} 
export async function updatePeacockRemoteColorOnly(color: string | undefined) {
  const config = vscode.workspace.getConfiguration();
  const section = `${extensionShortName}.${StandardSettings.RemoteColor}`;
  return await config.update(section, color, ConfigurationTarget.Workspace);
}
export async function updatePeacockColor(color: string | undefined ) {
  const config = vscode.workspace.getConfiguration();
  const section = `${extensionShortName}.${StandardSettings.Color}`;
  if (getSameRemoteLocalColor()){
    await updatePeacockRemoteColorOnly(color);
  }
  return await config.update(section, color, ConfigurationTarget.Workspace);
} 

export async function updatePeacockRemoteColor(color: string | undefined) {
  const config = vscode.workspace.getConfiguration();
  const section = `${extensionShortName}.${StandardSettings.RemoteColor}`;
  if  (getSameRemoteLocalColor()){
    await updatePeacockColorOnly(color);
  }
  return await config.update(section, color, ConfigurationTarget.Workspace);
}

export async function updateLiveShareColor(
  liveShareSetting: LiveShareSettings,
  color: string | undefined,
) {
  return await updateGlobalConfiguration(liveShareSetting, color);
}

export async function updateAffectedElements(values: IPeacockAffectedElementSettings) {
  await updateGlobalConfiguration(AffectedSettings.ActivityBar, values.activityBar);
  await updateGlobalConfiguration(AffectedSettings.StatusBar, values.statusBar);
  await updateGlobalConfiguration(AffectedSettings.TitleBar, values.titleBar);
  await updateGlobalConfiguration(AffectedSettings.EditorGroupBorder, values.editorGroupBorder);
  await updateGlobalConfiguration(AffectedSettings.PanelBorder, values.panelBorder);
  await updateGlobalConfiguration(AffectedSettings.SideBarBorder, values.sideBarBorder);
  await updateGlobalConfiguration(AffectedSettings.SashHover, values.sashHover);
  await updateGlobalConfiguration(
    AffectedSettings.StatusAndTitleBorders,
    values.statusAndTitleBorders,
  );
  await updateGlobalConfiguration(AffectedSettings.DebuggingStatusBar, values.debuggingStatusBar);
  await updateGlobalConfiguration(AffectedSettings.TabActiveBorder, values.tabActiveBorder);

  return true;
}

function removeDuplicatesToStarterSet(overrideFavorites?: IFavoriteColors[]) {
  const starter = overrideFavorites || starterSetOfFavorites;

  const { values: existingFavoriteColors } = getFavoriteColors();

  // starter set must be first, so it overrides the existing ones if their are dupes.
  const faves = [...starter, ...existingFavoriteColors];
  return faves.filter((fav, position, arr) => {
    return arr.map(o => o.name).indexOf(fav.name) === position;
  });
}
