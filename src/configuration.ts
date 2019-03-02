import {
  ColorSettings,
  Sections,
  Settings,
  ForegroundColors,
  extSuffix,
  preferredColorSeparator,
  AffectedSettings,
  AllSettings
} from './constants/enums';
import * as vscode from 'vscode';
import {
  IPeacockAffectedElementSettings,
  IPreferredColors
} from './constants/interfaces';

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
  setting: AllSettings, //Settings | AffectedSettings,
  defaultValue?: T | undefined
) {
  const value: T | undefined = workspace
    .getConfiguration(Sections.userPeacockSection)
    .get<T | undefined>(setting, defaultValue);
  return value as T;
}

export async function updateConfiguration<T>(
  setting: Settings | AffectedSettings,
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

// export function getAffectedSetting() {
//   return readConfiguration<boolean>(AffectedSettings.);
// }

export function getLightForeground() {
  const foregroundOverride = readConfiguration<string>(
    Settings.lightForeground
  );
  return foregroundOverride || ForegroundColors.LightForeground;
}

export function isAffectedSettingSelected(affectedSetting: AffectedSettings) {
  const isAffected = readConfiguration<boolean>(affectedSetting, false);
  return isAffected;
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

  if (isAffectedSettingSelected(AffectedSettings.TitleBar)) {
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
  if (isAffectedSettingSelected(AffectedSettings.ActivityBar)) {
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
  if (isAffectedSettingSelected(AffectedSettings.StatusBar)) {
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
  const sep = preferredColorSeparator;
  let values = readConfiguration<IPreferredColors[]>(Settings.preferredColors);
  const menu = values.map(pc => `${pc.name} ${sep} ${pc.value}`);
  values = values || [];
  return {
    menu,
    values
  };
}

export function getAffectedElements() {
  return <IPeacockAffectedElementSettings>{
    activityBar:
      readConfiguration<boolean>(AffectedSettings.ActivityBar) || false,
    statusBar: readConfiguration<boolean>(AffectedSettings.StatusBar) || false,
    titleBar: readConfiguration<boolean>(AffectedSettings.TitleBar) || false
  };
}

export async function updateAffectedElements(
  values: IPeacockAffectedElementSettings
) {
  await updateConfiguration(AffectedSettings.ActivityBar, values.activityBar);
  await updateConfiguration(AffectedSettings.StatusBar, values.statusBar);
  await updateConfiguration(AffectedSettings.TitleBar, values.titleBar);
  return true;
}

export async function updatePreferredColors(values: IPreferredColors[]) {
  return await updateConfiguration(Settings.preferredColors, values);
}
