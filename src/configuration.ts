import {
  ColorSettings,
  Sections,
  StandardSettings,
  extSuffix,
  IPreferredColors,
  preferredColorSeparator,
  IPeacockElementAdjustments,
  IElementStyle,
  ColorAdjustment,
  AllSettings,
  AffectedSettings,
  IPeacockAffectedElementSettings,
  ISettingsIndexer,
  IPeacockSettings
} from './models';
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
  setting: AllSettings,
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

export function isAffectedSettingSelected(affectedSetting: AffectedSettings) {
  return readConfiguration<boolean>(affectedSetting, false);
}

export function prepareColors(backgroundHex: string) {
  const keepForegroundColor = getKeepForegroundColor();

  let titleBarSettings = collectTitleBarSettings(
    backgroundHex,
    keepForegroundColor
  );

  let activityBarSettings = collectActivityBarSettings(
    backgroundHex,
    keepForegroundColor
  );

  let statusBarSettings = collectStatusBarSettings(
    backgroundHex,
    keepForegroundColor
  );

  // Merge all color settings
  const newColorCustomizations: any = {
    ...activityBarSettings,
    ...titleBarSettings,
    ...statusBarSettings
  };

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

export function getKeepForegroundColor() {
  return readConfiguration<boolean>(
    StandardSettings.KeepForegroundColor,
    false
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
  const adjustments = readConfiguration<IPeacockElementAdjustments>(
    StandardSettings.ElementAdjustments
  );
  return adjustments || {};
}

export async function updateElementAdjustments(
  adjustments: IPeacockElementAdjustments
) {
  return await updateConfiguration(
    StandardSettings.ElementAdjustments,
    adjustments
  );
}

export async function updateKeepForegroundColor(value: boolean) {
  return await updateConfiguration(StandardSettings.KeepForegroundColor, value);
}

export async function updatePreferredColors(values: IPreferredColors[]) {
  return await updateConfiguration(StandardSettings.PreferredColors, values);
}

export function getElementAdjustment(elementName: string): ColorAdjustment {
  const elementAdjustments = readConfiguration<any>(
    StandardSettings.ElementAdjustments,
    {}
  );

  return elementAdjustments[elementName];
}

export function getElementStyle(
  backgroundHex: string,
  elementName?: string
): IElementStyle {
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

function collectTitleBarSettings(
  backgroundHex: string,
  keepForegroundColor: boolean
) {
  const titleBarSettings = <ISettingsIndexer>{};
  if (isAffectedSettingSelected(AffectedSettings.TitleBar)) {
    const titleBarStyle = getElementStyle(backgroundHex, 'titleBar');
    titleBarSettings[ColorSettings.titleBar_activeBackground] =
      titleBarStyle.backgroundHex;
    titleBarSettings[ColorSettings.titleBar_inactiveBackground] =
      titleBarStyle.inactiveBackgroundHex;
    if (!keepForegroundColor) {
      titleBarSettings[ColorSettings.titleBar_activeForeground] =
        titleBarStyle.foregroundHex;
      titleBarSettings[ColorSettings.titleBar_inactiveForeground] =
        titleBarStyle.inactiveForegroundHex;
    }
  }
  return titleBarSettings;
}

function collectActivityBarSettings(
  backgroundHex: string,
  keepForegroundColor: boolean
) {
  const activityBarSettings = <ISettingsIndexer>{};

  if (isAffectedSettingSelected(AffectedSettings.ActivityBar)) {
    const activityBarStyle = getElementStyle(backgroundHex, 'activityBar');
    activityBarSettings[ColorSettings.activityBar_background] =
      activityBarStyle.backgroundHex;
    if (!keepForegroundColor) {
      activityBarSettings[ColorSettings.activityBar_foreground] =
        activityBarStyle.foregroundHex;
      activityBarSettings[ColorSettings.activityBar_inactiveForeground] =
        activityBarStyle.inactiveForegroundHex;
    }
  }
  return activityBarSettings;
}

function collectStatusBarSettings(
  backgroundHex: string,
  keepForegroundColor: boolean
) {
  const statusBarSettings = <ISettingsIndexer>{};
  if (isAffectedSettingSelected(AffectedSettings.StatusBar)) {
    const statusBarStyle = getElementStyle(backgroundHex, 'statusBar');
    statusBarSettings[ColorSettings.statusBar_background] =
      statusBarStyle.backgroundHex;
    if (!keepForegroundColor) {
      statusBarSettings[ColorSettings.statusBar_foreground] =
        statusBarStyle.foregroundHex;
    }
  }
  return statusBarSettings;
}
