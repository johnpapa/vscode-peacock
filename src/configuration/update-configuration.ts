import * as vscode from 'vscode';
import {
  extensionShortName,
  AllSettings,
  Sections,
  IPeacockElementAdjustments,
  StandardSettings,
  IFavoriteColors,
  State,
  IPeacockAffectedElementSettings,
  AffectedSettings,
  starterSetOfFavorites,
} from '../models';
import { Logger } from '../logging';
import { getFavoriteColors } from './read-configuration';
import { notify } from '../notification';

export async function updateGlobalConfiguration<T>(setting: AllSettings, value?: any) {
  let config = vscode.workspace.getConfiguration();
  const section = `${extensionShortName}.${setting}`;
  Logger.info(`${extensionShortName}: Updating the user settings with the following changes:`);
  if (value && Array.isArray(value) && value.length > 0) {
    Logger.info(value, true, `${extensionShortName}:  ${section}`);
  } else {
    Logger.info(`${extensionShortName}: ${section} = ${value}`, true);
  }
  return await config.update(section, value, vscode.ConfigurationTarget.Global);
}

export async function updateWorkspaceConfiguration(colorCustomizations: {} | undefined) {
  Logger.info(
    `${extensionShortName}: Updating the workspace with the following color customizations`,
  );
  Logger.info(colorCustomizations, true);
  return await vscode.workspace
    .getConfiguration()
    .update(
      Sections.workspacePeacockSection,
      colorCustomizations,
      vscode.ConfigurationTarget.Workspace,
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

export async function updateDarkenLightenPrecentage(value: number) {
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
  let msg = `${extensionShortName}: Adding recommended favorite colors to user settings for version ${State.extensionVersion}`;
  notify(msg, true);

  const newFavoriteColors = removeDuplicatesToStarterSet(overrideFavorites);
  return await updateFavoriteColors(newFavoriteColors);
}

export async function updateFavoriteColors(values: IFavoriteColors[]) {
  return await updateGlobalConfiguration(StandardSettings.FavoriteColors, values);
}

export async function updateAffectedElements(values: IPeacockAffectedElementSettings) {
  await updateGlobalConfiguration(AffectedSettings.ActivityBar, values.activityBar);
  await updateGlobalConfiguration(AffectedSettings.StatusBar, values.statusBar);
  await updateGlobalConfiguration(AffectedSettings.TitleBar, values.titleBar);
  await updateGlobalConfiguration(AffectedSettings.TabActiveBorder, values.tabActiveBorder);
  await updateGlobalConfiguration(AffectedSettings.SidebarBorder, values.sidebarBorder);
  await updateGlobalConfiguration(AffectedSettings.PanelBorder, values.panelBorder);

  return true;
}

function removeDuplicatesToStarterSet(overrideFavorites?: IFavoriteColors[]) {
  let starter = overrideFavorites || starterSetOfFavorites;

  const { values: existingFavoriteColors } = getFavoriteColors();

  // starter set must be first, so it overrides the existing ones if their are dupes.
  let faves = [...starter, ...existingFavoriteColors];
  return faves.filter((fav, position, arr) => {
    return arr.map(o => o.name).indexOf(fav.name) === position;
  });
}
