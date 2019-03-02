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
  getLightenedColorHex,
  getDarkenedColorHex
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
    const titleBarStyle = getElementStyle('titleBar', backgroundHex);
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
    const activityBarStyle = getElementStyle('activityBar', backgroundHex);
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
    const statusBarStyle = getElementStyle('statusBar', backgroundHex);
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

export function getElementAdjustments(elementName: string): IElementAdjustments {
  const elementAdjustments = readConfiguration<any>(
    Settings.elementAdjustments,
    {}
  );

  return elementAdjustments[elementName];
}

export function getElementStyle(elementName: string, backgroundHex: string): IElementStyle {
  let style = {
    backgroundHex: backgroundHex,
    foregroundHex: getForegroundColorHex(backgroundHex),
    inactiveBackgroundHex: getInactiveBackgroundColorHex(backgroundHex),
    inactiveForegroundHex: getInactiveForegroundColorHex(backgroundHex)
  };

  const adjustments = getElementAdjustments(elementName);
  if (adjustments) {
    style = adjustElementStyle(style, adjustments);
  }

  return style;
}

export function adjustElementStyle(style: IElementStyle, adjustments: IElementAdjustments): IElementStyle {
  if (adjustments.background) {
    style.backgroundHex = applyAdjustment(style.backgroundHex, style.backgroundHex, adjustments.background);
    style.foregroundHex = getForegroundColorHex(style.backgroundHex),
    style.inactiveForegroundHex = getInactiveForegroundColorHex(style.backgroundHex);
  }
  if (adjustments.foreground) {
    style.foregroundHex = applyAdjustment(style.foregroundHex, getForegroundColorHex(style.backgroundHex), adjustments.foreground);
  }
  if (adjustments.inactiveBackground) {
    style.inactiveBackgroundHex = applyAdjustment(style.inactiveBackgroundHex, style.backgroundHex, adjustments.inactiveBackground);
  }
  if (adjustments.inactiveForeground) {
    style.inactiveForegroundHex = applyAdjustment(style.inactiveForegroundHex, style.foregroundHex, adjustments.inactiveForeground);
  }

  return style;
}

function applyAdjustment(hex: string, ignoredHex: string, adjustment: ColorAdjustment) {
  if (adjustment === 'ignore') {
    return ignoredHex;
  }
  return adjustment === 'lighten' ? getLightenedColorHex(hex) : getDarkenedColorHex(hex);
}

export async function updatePreferredColors(values: IPreferredColors[]) {
  return await updateConfiguration(StandardSettings.PreferredColors, values);
}
