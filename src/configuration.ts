import {
  ColorSettings,
  Sections,
  Settings,
  ForegroundColors,
  extSuffix,
  IPreferredColors
} from './constants/enums';
import * as vscode from 'vscode';

const { workspace } = vscode;

export function readWorkspaceConfiguration<T>(
  colorSettings: ColorSettings,
  defaultValue?: T | undefined
) {
  const value: T | undefined = workspace
    .getConfiguration(Sections.workspacePeacockSection)
    .get<T | undefined>(colorSettings, defaultValue);
  return value as T;
}

export function readConfiguration<T>(
  setting: Settings,
  defaultValue?: T | undefined
) {
  const value: T | undefined = workspace
    .getConfiguration(Sections.userPeacockSection)
    .get<T | undefined>(setting, defaultValue);
  return value as T;
}

export async function updateConfiguration<T>(
  setting: Settings,
  value?: T | undefined
) {
  let config = vscode.workspace.getConfiguration();
  return await config.update(
    `${extSuffix}.${setting}`,
    value,
    vscode.ConfigurationTarget.Global
  );
}

export function getDarkForeground() {
  const foregroundOverride = readConfiguration<string>(Settings.darkForeground);
  return foregroundOverride || ForegroundColors.DarkForeground;
}

export function getLightForeground() {
  const foregroundOverride = readConfiguration<string>(
    Settings.lightForeground
  );
  return foregroundOverride || ForegroundColors.LightForeground;
}

export function isSettingSelected(setting: string) {
  const affectedElements = readConfiguration<string[]>(
    Settings.affectedElements,
    []
  );

  // check if they requested a setting
  const itExists: boolean = !!(
    affectedElements && affectedElements.includes(setting)
  );

  return itExists;
}

export function prepareColors(backgroundHex: string, foregroundHex: string) {
  const colorCustomizations = workspace
    .getConfiguration()
    .get('workbench.colorCustomizations');
  let newSettings = {
    titleBarSettings: {},
    activityBarSettings: {},
    statusBarSettings: {}
  };

  let settingsToReset = [];

  if (isSettingSelected('titleBar')) {
    newSettings.titleBarSettings = {
      [ColorSettings.titleBar_activeBackground]: backgroundHex,
      [ColorSettings.titleBar_activeForeground]: foregroundHex,
      [ColorSettings.titleBar_inactiveBackground]: backgroundHex,
      [ColorSettings.titleBar_inactiveForeground]: foregroundHex
    };
  } else {
    settingsToReset.push(
      ColorSettings.titleBar_activeBackground,
      ColorSettings.titleBar_activeForeground,
      ColorSettings.titleBar_inactiveBackground,
      ColorSettings.titleBar_inactiveForeground
    );
  }
  if (isSettingSelected('activityBar')) {
    newSettings.activityBarSettings = {
      [ColorSettings.activityBar_background]: backgroundHex,
      [ColorSettings.activityBar_foreground]: foregroundHex,
      [ColorSettings.activityBar_inactiveForeground]: foregroundHex
    };
  } else {
    settingsToReset.push(
      ColorSettings.activityBar_background,
      ColorSettings.activityBar_foreground,
      ColorSettings.activityBar_inactiveForeground
    );
  }
  if (isSettingSelected('statusBar')) {
    newSettings.statusBarSettings = {
      [ColorSettings.statusBar_background]: backgroundHex,
      [ColorSettings.statusBar_foreground]: foregroundHex
    };
  } else {
    settingsToReset.push(
      ColorSettings.statusBar_background,
      ColorSettings.statusBar_foreground
    );
  }
  // Merge all color settings
  const newColorCustomizations: any = {
    ...colorCustomizations,
    ...newSettings.activityBarSettings,
    ...newSettings.titleBarSettings,
    ...newSettings.statusBarSettings
  };

  Object.values(settingsToReset).forEach(setting => {
    delete newColorCustomizations[setting];
  });

  return newColorCustomizations;
}

export async function changeColorSetting(colorCustomizations: {}) {
  return await workspace
    .getConfiguration()
    .update(
      'workbench.colorCustomizations',
      colorCustomizations,
      vscode.ConfigurationTarget.Workspace
    );
}

export function getPreferredColors() {
  const values = readConfiguration<IPreferredColors[]>(
    Settings.preferredColors
  );
  return values || [];
}

export function getAffectedElements() {
  const values = readConfiguration<string[]>(Settings.affectedElements);
  return values || [];
}

export async function updateAffectedElements(values: string[]) {
  return await updateConfiguration(Settings.affectedElements, values);
}

export async function updatePreferredColors(values: string[]) {
  return await updateConfiguration(Settings.preferredColors, values);
}
