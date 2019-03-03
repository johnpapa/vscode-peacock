import {
  ColorSettings,
  Sections,
  StandardSettings,
  ForegroundColors,
  extSuffix,
  IPreferredColors,
  preferredColorSeparator,
  IElementAdjustments,
  IElementStyle,
  ColorAdjustment
} from './constants/enums';
import {
  getForegroundColorHex,
  getInactiveBackgroundColorHex,
  getInactiveForegroundColorHex,
  getAdjustedColorHex
} from './color-library';
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
  setting: AllSettings, //Settings | AffectedSettings,
  defaultValue?: T | undefined
) {
  const value: T | undefined = workspace
    .getConfiguration(Sections.userPeacockSection)
    .get<T | undefined>(setting, defaultValue);
  return value as T;
}

export async function updateConfiguration<T>(
  setting: AllSettings,
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
  const foregroundOverride = readConfiguration<string>(
    StandardSettings.DarkForeground
  );
  return foregroundOverride || ForegroundColors.DarkForeground;
}

// export function getAffectedSetting() {
//   return readConfiguration<boolean>(AffectedSettings.);
// }

export function getLightForeground() {
  const foregroundOverride = readConfiguration<string>(
    StandardSettings.LightForeground
  );
  return foregroundOverride || ForegroundColors.LightForeground;
}

export function isAffectedSettingSelected(affectedSetting: AffectedSettings) {
  const isAffected = readConfiguration<boolean>(affectedSetting, false);
  return isAffected;
}

export function prepareColors(backgroundHex: string) {
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
    const titleBarStyle = getElementStyle(backgroundHex, 'titleBar');
    newSettings.titleBarSettings = {
      [ColorSettings.titleBar_activeBackground]: titleBarStyle.backgroundHex,
      [ColorSettings.titleBar_activeForeground]: titleBarStyle.foregroundHex,
      [ColorSettings.titleBar_inactiveBackground]: titleBarStyle.inactiveBackgroundHex,
      [ColorSettings.titleBar_inactiveForeground]: titleBarStyle.inactiveForegroundHex
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
    const activityBarStyle = getElementStyle(backgroundHex, 'activityBar');
    newSettings.activityBarSettings = {
      [ColorSettings.activityBar_background]: activityBarStyle.backgroundHex,
      [ColorSettings.activityBar_foreground]: activityBarStyle.foregroundHex,
      [ColorSettings.activityBar_inactiveForeground]: activityBarStyle.inactiveForegroundHex
    };
  } else {
    settingsToReset.push(
      ColorSettings.activityBar_background,
      ColorSettings.activityBar_foreground,
      ColorSettings.activityBar_inactiveForeground
    );
  }
  if (isAffectedSettingSelected(AffectedSettings.StatusBar)) {
    const statusBarStyle = getElementStyle(backgroundHex, 'statusBar');
    newSettings.statusBarSettings = {
      [ColorSettings.statusBar_background]: statusBarStyle.backgroundHex,
      [ColorSettings.statusBar_foreground]: statusBarStyle.foregroundHex
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
  let values = readConfiguration<IPreferredColors[]>(
    StandardSettings.PreferredColors
  );
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

export function getElementAdjustments() {
  const adjustments = readConfiguration<IElementAdjustments>(Settings.elementAdjustments);
  return adjustments || {};
}

export async function updateAffectedElements(values: string[]) {
  return await updateConfiguration(Settings.affectedElements, values);
}

export async function updateElementAdjustments(adjustments: IElementAdjustments) {
  return await updateConfiguration(Settings.elementAdjustments, adjustments);
}

export async function updatePreferredColors(values: IPreferredColors[]) {
  return await updateConfiguration(Settings.preferredColors, values);
}

export function getElementAdjustment(elementName: string): ColorAdjustment {
  const elementAdjustments = readConfiguration<any>(
    Settings.elementAdjustments,
    {}
  );

  return elementAdjustments[elementName];
}

export function getElementStyle(backgroundHex: string, elementName?: string): IElementStyle {
  let styleHex = backgroundHex;

  if (elementName) {
    const adjustment = getElementAdjustment(elementName);
    if (adjustment) {
      styleHex = getAdjustedColorHex(backgroundHex, adjustment);
    }
  }

  return {
    backgroundHex: styleHex,
    foregroundHex: getForegroundColorHex(styleHex),
    inactiveBackgroundHex: getInactiveBackgroundColorHex(styleHex),
    inactiveForegroundHex: getInactiveForegroundColorHex(styleHex)
  };
}
