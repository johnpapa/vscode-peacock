import {
  ColorSettings,
  Sections,
  StandardSettings,
  extensionShortName,
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
  IElementColors,
  ForegroundColors,
  starterSetOfFavorites,
  defaultAmountToDarkenLighten,
  State
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
import { Logger } from './logging';

const { workspace } = vscode;

export function getSurpriseMeFromFavoritesOnly() {
  return readConfiguration<boolean>(
    StandardSettings.SurpriseMeFromFavoritesOnly,
    false
  );
}

export function getDarkenLightenPercentage() {
  return readConfiguration<number>(
    StandardSettings.DarkenLightenPercentage,
    defaultAmountToDarkenLighten
  );
}

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

export async function updateGlobalConfiguration<T>(
  setting: AllSettings,
  value?: any
) {
  let config = vscode.workspace.getConfiguration();
  const section = `${extensionShortName}.${setting}`;
  Logger.info(
    `${extensionShortName}: Updating the user settings with the following changes:`
  );
  if (value && value.length) {
    Logger.info(`${extensionShortName}:  ${section}`, true);
    value.map((item: any) => {
      Logger.info(item, true);
    });
  } else {
    Logger.info(`${extensionShortName}: ${section} = ${value}`, true);
  }
  return await config.update(section, value, vscode.ConfigurationTarget.Global);
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

export async function updateWorkspaceConfiguration(
  colorCustomizations: {} | undefined
) {
  Logger.info(
    `${extensionShortName}: Updating the workspace with the following color customizations`
  );
  Logger.info(colorCustomizations, true);
  return await workspace
    .getConfiguration()
    .update(
      Sections.workspacePeacockSection,
      colorCustomizations,
      vscode.ConfigurationTarget.Workspace
    );
}

export function getDarkForegroundColor() {
  return readConfiguration<string>(StandardSettings.DarkForegroundColor, '');
}

export function getDarkForegroundColorOrOverride() {
  return getDarkForegroundColor() || ForegroundColors.DarkForeground;
}

export function getLightForegroundColor() {
  return readConfiguration<string>(StandardSettings.LightForegroundColor, '');
}

export function getLightForegroundColorOrOverride() {
  return getLightForegroundColor() || ForegroundColors.LightForeground;
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
  const menu = values.map(fav => `${fav.name} ${sep} ${fav.value}`);
  values = values || [];
  return {
    menu,
    values
  };
}

export function getRandomFavoriteColor() {
  const { values: favoriteColors } = getFavoriteColors();
  let randomFavorite =
    favoriteColors[Math.floor(Math.random() * favoriteColors.length)];
  return randomFavorite;
}

export function getSurpriseMeOnStartup() {
  return readConfiguration<boolean>(
    StandardSettings.SurpriseMeOnStartup,
    false
  );
}

export function getAffectedElements() {
  return <IPeacockAffectedElementSettings>{
    activityBar:
      readConfiguration<boolean>(AffectedSettings.ActivityBar) || false,
    statusBar: readConfiguration<boolean>(AffectedSettings.StatusBar) || false,
    titleBar: readConfiguration<boolean>(AffectedSettings.TitleBar) || false
  };
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
  return await updateGlobalConfiguration(
    StandardSettings.ElementAdjustments,
    adjustments
  );
}

export async function updateKeepForegroundColor(value: boolean) {
  return await updateGlobalConfiguration(
    StandardSettings.KeepForegroundColor,
    value
  );
}

export async function updateKeepBadgeColor(value: boolean) {
  return await updateGlobalConfiguration(
    StandardSettings.KeepBadgeColor,
    value
  );
}

export async function updateSurpriseMeOnStartup(value: boolean) {
  return await updateGlobalConfiguration(
    StandardSettings.SurpriseMeOnStartup,
    value
  );
}

export async function updateDarkForegroundColor(value: string) {
  return await updateGlobalConfiguration(
    StandardSettings.DarkForegroundColor,
    value
  );
}

export async function updateLightForegroundColor(value: string) {
  return await updateGlobalConfiguration(
    StandardSettings.LightForegroundColor,
    value
  );
}

export async function updateDarkenLightenPrecentage(value: number) {
  return await updateGlobalConfiguration(
    StandardSettings.DarkenLightenPercentage,
    value
  );
}

export async function updateSurpriseMeFromFavoritesOnly(value: boolean) {
  return await updateGlobalConfiguration(
    StandardSettings.SurpriseMeFromFavoritesOnly,
    value
  );
}

export async function addNewFavoriteColor(name: string, value: string) {
  const { values: favoriteColors } = getFavoriteColors();
  const newFavoriteColors = [...favoriteColors, { name, value }];
  return await updateFavoriteColors(newFavoriteColors);
}

export async function writeRecommendedFavoriteColors(
  overrideFavorites?: IFavoriteColors[]
) {
  let msg = `${extensionShortName}: Adding recommended favorite colors to user settings for version ${
    State.extensionVersion
  }`;
  Logger.info(msg);
  vscode.window.showInformationMessage(msg);

  const newFavoriteColors = removeDuplicatesToStarterSet(overrideFavorites);
  return await updateFavoriteColors(newFavoriteColors);
}

export async function updateFavoriteColors(values: IFavoriteColors[]) {
  return await updateGlobalConfiguration(
    StandardSettings.FavoriteColors,
    values
  );
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
    value => `${extensionShortName}.${value}`
  );
  const standardSettings = Object.values(StandardSettings).map(
    value => `${extensionShortName}.${value}`
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

export function hasFavorites() {
  const s = getAllUserSettings();
  return s.favoriteColors.values.length;
}

export async function updateAffectedElements(
  values: IPeacockAffectedElementSettings
) {
  await updateGlobalConfiguration(
    AffectedSettings.ActivityBar,
    values.activityBar
  );
  await updateGlobalConfiguration(AffectedSettings.StatusBar, values.statusBar);
  await updateGlobalConfiguration(AffectedSettings.TitleBar, values.titleBar);

  return true;
}

function getAllUserSettings() {
  const favoriteColors = getFavoriteColors();
  const elementAdjustments = getElementAdjustments();
  const keepBadgeColor = getKeepBadgeColor();
  const keepForegroundColor = getKeepForegroundColor();
  const surpriseMeOnStartup = getSurpriseMeOnStartup();
  const darkForegroundColor = getDarkForegroundColor();
  const lightForegroundColor = getLightForegroundColor();
  const {
    activityBar: affectActivityBar,
    statusBar: affectStatusBar,
    titleBar: affectTitleBar
  } = getAffectedElements();
  return {
    favoriteColors,
    elementAdjustments,
    keepBadgeColor,
    keepForegroundColor,
    surpriseMeOnStartup,
    darkForegroundColor,
    lightForegroundColor,
    affectActivityBar,
    affectStatusBar,
    affectTitleBar
  };
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

function removeDuplicatesToStarterSet(overrideFavorites?: IFavoriteColors[]) {
  let starter = overrideFavorites || starterSetOfFavorites;

  const { values: existingFavoriteColors } = getFavoriteColors();

  // starter set must be first, so it overrides the existing ones if their are dupes.
  let faves = [...starter, ...existingFavoriteColors];
  return faves.filter((fav, position, arr) => {
    return arr.map(o => o.name).indexOf(fav.name) === position;
  });
}
