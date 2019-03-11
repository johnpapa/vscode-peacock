import {
  ColorSettings,
  Sections,
  StandardSettings,
  extSuffix,
  IFavoriteColors,
  favoriteColorSeparator,
  IPeacockElementAdjustments,
  IElementStyle,
  ColorAdjustment,
  AllSettings,
  AffectedSettings,
  IPeacockAffectedElementSettings,
  ISettingsIndexer,
  ElementNames,
  ColorAdjustmentOptions,
  IElementColors
} from './models';
import {
  getAdjustedColorHex,
  getBadgeBackgroundColorHex,
  getBackgroundHoverColorHex,
  getForegroundColorHex,
  getInactiveBackgroundColorHex,
  getInactiveForegroundColorHex
} from './color-library';
import * as vscode from 'vscode';

const { workspace } = vscode;

export function getPeacockWorkspaceConfig() {
  return workspace.getConfiguration(Sections.workspacePeacockSection);
}

export function getUserConfig() {
  return workspace.getConfiguration(Sections.userPeacockSection);
}

export function getCurrentColorBeforeAdjustments() {
  // Get the current color, before any adjustments were made
  let config = getPeacockWorkspaceConfig();
  const elementColors = getElementColors(config);
  let { color, adjustment } = getColorAndAdjustment(elementColors);
  let originalColor = '';
  if (color) {
    originalColor = getOriginalColor(color, adjustment);
  }
  return originalColor;
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
  const keepBadgeColor = getKeepBadgeColor();

  let titleBarSettings = collectTitleBarSettings(
    backgroundHex,
    keepForegroundColor
  );

  let activityBarSettings = collectActivityBarSettings(
    backgroundHex,
    keepForegroundColor,
    keepBadgeColor
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

export async function changeColorSetting(colorCustomizations: {} | undefined) {
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

export function getKeepBadgeColor() {
  return readConfiguration<boolean>(StandardSettings.KeepBadgeColor, false);
}

export function getFavoriteColors() {
  const sep = favoriteColorSeparator;
  let values = readConfiguration<IFavoriteColors[]>(
    StandardSettings.FavoriteColors
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

export async function updateKeepBadgeColor(value: boolean) {
  return await updateConfiguration(StandardSettings.KeepBadgeColor, value);
}

export async function addNewFavoriteColor(name: string, value: string) {
  const { values: favoriteColors } = getFavoriteColors();
  const newFavoriteColors = [...favoriteColors, { name, value }];
  return await updateFavoriteColors(newFavoriteColors);
}

export async function updateFavoriteColors(values: IFavoriteColors[]) {
  return await updateConfiguration(StandardSettings.FavoriteColors, values);
}

export function getElementAdjustment(elementName: string): ColorAdjustment {
  const elementAdjustments = getElementAdjustments();
  return elementAdjustments[elementName];
}

export function getElementStyle(
  backgroundHex: string,
  elementName?: string,
  includeBadgeStyles = false
): IElementStyle {
  let styleHex = backgroundHex;

  if (elementName) {
    const adjustment = getElementAdjustment(elementName);
    if (adjustment) {
      styleHex = getAdjustedColorHex(backgroundHex, adjustment);
    }
  }

  let style = <IElementStyle>{
    backgroundHex: styleHex,
    backgroundHoverHex: getBackgroundHoverColorHex(styleHex),
    foregroundHex: getForegroundColorHex(styleHex),
    inactiveBackgroundHex: getInactiveBackgroundColorHex(styleHex),
    inactiveForegroundHex: getInactiveForegroundColorHex(styleHex)
  };

  if (includeBadgeStyles) {
    style.badgeBackgroundHex = getBadgeBackgroundColorHex(styleHex);
    style.badgeForegroundHex = getForegroundColorHex(style.badgeBackgroundHex);
  }

  return style;
}

export function getAllSettingNames() {
  let settings = [];
  const affectedSettings = Object.values(AffectedSettings).map(
    value => `${extSuffix}.${value}`
  );
  const standardSettings = Object.values(StandardSettings).map(
    value => `${extSuffix}.${value}`
  );
  settings.push(...affectedSettings);
  settings.push(...standardSettings);
  return settings;
}

export function checkIfPeacockSettingsChanged(
  e: vscode.ConfigurationChangeEvent
) {
  return getAllSettingNames().some(setting => e.affectsConfiguration(setting));
}

function collectTitleBarSettings(
  backgroundHex: string,
  keepForegroundColor: boolean
) {
  const titleBarSettings = <ISettingsIndexer>{};
  if (isAffectedSettingSelected(AffectedSettings.TitleBar)) {
    const titleBarStyle = getElementStyle(backgroundHex, ElementNames.titleBar);
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
  keepForegroundColor: boolean,
  keepBadgeColor: boolean
) {
  const activityBarSettings = <ISettingsIndexer>{};

  if (isAffectedSettingSelected(AffectedSettings.ActivityBar)) {
    const activityBarStyle = getElementStyle(
      backgroundHex,
      ElementNames.activityBar,
      true
    );
    activityBarSettings[ColorSettings.activityBar_background] =
      activityBarStyle.backgroundHex;

    if (!keepForegroundColor) {
      activityBarSettings[ColorSettings.activityBar_foreground] =
        activityBarStyle.foregroundHex;
      activityBarSettings[ColorSettings.activityBar_inactiveForeground] =
        activityBarStyle.inactiveForegroundHex;
    }

    if (!keepBadgeColor) {
      activityBarSettings[ColorSettings.activityBar_badgeBackground] =
        activityBarStyle.badgeBackgroundHex;
      activityBarSettings[ColorSettings.activityBar_badgeForeground] =
        activityBarStyle.badgeForegroundHex;
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
    const statusBarStyle = getElementStyle(
      backgroundHex,
      ElementNames.statusBar
    );
    statusBarSettings[ColorSettings.statusBar_background] =
      statusBarStyle.backgroundHex;
    statusBarSettings[ColorSettings.statusBarItem_hoverBackground] =
      statusBarStyle.backgroundHoverHex;

    if (!keepForegroundColor) {
      statusBarSettings[ColorSettings.statusBar_foreground] =
        statusBarStyle.foregroundHex;
    }
  }
  return statusBarSettings;
}

function getElementColors(
  config: vscode.WorkspaceConfiguration
): IElementColors {
  return {
    [ElementNames.activityBar]: config[ColorSettings.activityBar_background],
    [ElementNames.statusBar]: config[ColorSettings.statusBar_background],
    [ElementNames.titleBar]: config[ColorSettings.titleBar_activeBackground]
  };
}

function getColorAndAdjustment(elementColors: IElementColors) {
  let color = '';
  let el: ElementNames = ElementNames.activityBar;
  if (elementColors[ElementNames.activityBar]) {
    el = ElementNames.activityBar;
    color = elementColors[el];
  } else if (elementColors[ElementNames.statusBar]) {
    el = ElementNames.statusBar;
    color = elementColors[el];
  } else if (elementColors[ElementNames.titleBar]) {
    el = ElementNames.titleBar;
    color = elementColors[el];
  }
  const adjustment = getElementAdjustment(el);
  return { color, adjustment };
}

export function getOriginalColorsForAllElements() {
  let config = getPeacockWorkspaceConfig();

  const elementColors = getElementColors(config);

  const elementAdjustments = getElementAdjustments();

  let originalElementColors: IElementColors = {
    [ElementNames.activityBar]: getOriginalColor(
      elementColors[ElementNames.activityBar],
      elementAdjustments[ElementNames.activityBar]
    ),
    [ElementNames.statusBar]: getOriginalColor(
      elementColors[ElementNames.statusBar],
      elementAdjustments[ElementNames.statusBar]
    ),
    [ElementNames.titleBar]: getOriginalColor(
      elementColors[ElementNames.titleBar],
      elementAdjustments[ElementNames.titleBar]
    )
  };
  return originalElementColors;
}

export function getExistingColorCustomizations() {
  return workspace.getConfiguration().get(Sections.workspacePeacockSection);
}

function getOriginalColor(color: string, adjustment: ColorAdjustment) {
  let oppositeAdjustment: ColorAdjustmentOptions;

  switch (adjustment) {
    case ColorAdjustmentOptions.darken:
      oppositeAdjustment = ColorAdjustmentOptions.lighten;
      break;

    case ColorAdjustmentOptions.lighten:
      oppositeAdjustment = ColorAdjustmentOptions.darken;
      break;

    default:
      oppositeAdjustment = ColorAdjustmentOptions.none;
      break;
  }
  return getAdjustedColorHex(color, oppositeAdjustment);
}
