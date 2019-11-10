import * as vscode from 'vscode';
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
  defaultAmountToDarkenLighten,
  ColorSource,
} from '../models';
import {
  getAdjustedColorHex,
  getBadgeBackgroundColorHex,
  getBackgroundHoverColorHex,
  getForegroundColorHex,
  getInactiveBackgroundColorHex,
  getInactiveForegroundColorHex,
} from '../color-library';
import { LiveShareSettings } from '../live-share';

const { workspace } = vscode;

export function getSurpriseMeFromFavoritesOnly() {
  return readConfiguration<boolean>(StandardSettings.SurpriseMeFromFavoritesOnly, false);
}

export function getDarkenLightenPercentage() {
  return readConfiguration<number>(
    StandardSettings.DarkenLightenPercentage,
    defaultAmountToDarkenLighten,
  );
}

export function getShowColorInStatusBar() {
  return readConfiguration<boolean>(StandardSettings.ShowColorInStatusBar, true);
}

export function getColorCustomizationConfig() {
  // This currently gets the merged color customization set.
  // If we want to get just the ones from workspace,
  // we should change functions to use getColorCustomizationConfigFromWorkspace
  return workspace.getConfiguration(Sections.peacockColorCustomizationSection);
}

export function getColorCustomizationConfigFromWorkspace() {
  const inspect = workspace.getConfiguration().inspect(Sections.peacockColorCustomizationSection);

  if (!inspect) {
    return {};
  }

  if (typeof inspect.workspaceValue !== 'object') {
    return {};
  }

  const colorCustomizations: ISettingsIndexer = inspect.workspaceValue as ISettingsIndexer;

  return colorCustomizations;
}

export function getPeacockWorkspace() {
  return workspace.getConfiguration(extensionShortName);
}

export function getUserConfig() {
  return workspace.getConfiguration(Sections.peacockSection);
}

export function getCurrentColorBeforeAdjustments() {
  /**
   * Useful if we dont want the
   *       peacock color but instead to calculate it from
   *       the current customized colors
   *
   * Get the current color, before any adjustments were made
   */
  const config = getColorCustomizationConfig();
  const elementColors = getElementColors(config);
  const { color, adjustment } = getColorAndAdjustment(elementColors);
  let originalColor = '';
  if (color) {
    originalColor = getOriginalColor(color, adjustment);
  }
  return originalColor;
}

export function readConfiguration<T>(setting: AllSettings, defaultValue?: T | undefined) {
  const value: T | undefined = workspace
    .getConfiguration(Sections.peacockSection)
    .get<T | undefined>(setting, defaultValue);
  return value as T;
}

export function isAffectedSettingSelected(affectedSetting: AffectedSettings) {
  return readConfiguration<boolean>(affectedSetting, false);
}

export function prepareColors(backgroundHex: string) {
  const keepForegroundColor = getKeepForegroundColor();
  const keepBadgeColor = getKeepBadgeColor();

  const titleBarSettings = collectTitleBarSettings(backgroundHex, keepForegroundColor);

  const activityBarSettings = collectActivityBarSettings(
    backgroundHex,
    keepForegroundColor,
    keepBadgeColor,
  );

  const accentBorderSettings = collectAccentBorderSettings(backgroundHex);

  const statusBarSettings = collectStatusBarSettings(backgroundHex, keepForegroundColor);

  // Merge all color settings
  const newColorCustomizations: any = {
    ...activityBarSettings,
    ...titleBarSettings,
    ...statusBarSettings,
    ...accentBorderSettings,
  };

  return newColorCustomizations;
}

export function getDarkForegroundColor() {
  return readConfiguration<string>(StandardSettings.DarkForegroundColor, '');
}

export function getEnvironmentAwareColor() {
  const color = vscode.env.remoteName ? getPeacockRemoteColor() : getPeacockColor();
  return color;
}

export function inspectColor() {
  const setting = vscode.env.remoteName ? StandardSettings.RemoteColor : StandardSettings.Color;
  const section = `${Sections.peacockSection}.${setting}`;
  const config = workspace.getConfiguration().inspect(section);

  let colorSource = ColorSource.None;
  if (!config) {
    return { colorSource };
  }

  if (config.workspaceValue) {
    colorSource = ColorSource.WorkspaceValue;
  } else if (config.globalValue) {
    colorSource = ColorSource.GlobalValue;
  } else if (config.defaultValue) {
    colorSource = ColorSource.DefaultValue;
  }

  return { colorSource, ...config };
}

export function getPeacockColor() {
  const color = readConfiguration<string>(StandardSettings.Color);
  return color;
}

export function getPeacockRemoteColor() {
  const remoteColor = readConfiguration<string>(StandardSettings.RemoteColor);
  return remoteColor;
}

export function getLiveShareColor(liveShareSetting: LiveShareSettings) {
  return readConfiguration<string>(liveShareSetting, '');
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
  return readConfiguration<boolean>(StandardSettings.KeepForegroundColor, false);
}

export function getKeepBadgeColor() {
  return readConfiguration<boolean>(StandardSettings.KeepBadgeColor, false);
}

export function getFavoriteColors() {
  const sep = favoriteColorSeparator;
  let values = readConfiguration<IFavoriteColors[]>(StandardSettings.FavoriteColors);
  const menu = values.map(fav => `${fav.name} ${sep} ${fav.value}`);
  values = values || [];
  return {
    menu,
    values,
  };
}

export function getRandomFavoriteColor() {
  const { values: favoriteColors } = getFavoriteColors();
  const currentColor = getEnvironmentAwareColor();
  let newColorFromFavorites: IFavoriteColors;
  do {
    newColorFromFavorites = favoriteColors[Math.floor(Math.random() * favoriteColors.length)];
  } while (
    favoriteColors.length > 1 &&
    newColorFromFavorites.value.toLowerCase() === currentColor.toLowerCase()
  );
  return newColorFromFavorites;
}

export function getSurpriseMeOnStartup() {
  return readConfiguration<boolean>(StandardSettings.SurpriseMeOnStartup, false);
}

export function getAffectedElements() {
  return {
    activityBar: readConfiguration<boolean>(AffectedSettings.ActivityBar) || false,
    statusBar: readConfiguration<boolean>(AffectedSettings.StatusBar) || false,
    titleBar: readConfiguration<boolean>(AffectedSettings.TitleBar) || false,
    accentBorders: readConfiguration<boolean>(AffectedSettings.AccentBorders) || false,
    tabActiveBorder: readConfiguration<boolean>(AffectedSettings.TabActiveBorder) || false,
  } as IPeacockAffectedElementSettings;
}

export function getElementAdjustments() {
  const adjustments = readConfiguration<IPeacockElementAdjustments>(
    StandardSettings.ElementAdjustments,
  );
  return adjustments || {};
}

export function getElementAdjustment(elementName: string): ColorAdjustment {
  const elementAdjustments = getElementAdjustments();
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

  const style = {
    backgroundHex: styleHex,
    backgroundHoverHex: getBackgroundHoverColorHex(styleHex),
    foregroundHex: getForegroundColorHex(styleHex),
    inactiveBackgroundHex: getInactiveBackgroundColorHex(styleHex),
    inactiveForegroundHex: getInactiveForegroundColorHex(styleHex),
  } as IElementStyle;

  style.badgeBackgroundHex = getBadgeBackgroundColorHex(styleHex);
  style.badgeForegroundHex = getForegroundColorHex(style.badgeBackgroundHex);

  return style;
}

export function getAllSettingNames() {
  const settings = [];
  const affectedSettings = Object.values(AffectedSettings).map(
    value => `${extensionShortName}.${value}`,
  );
  const standardSettings = Object.values(StandardSettings).map(
    value => `${extensionShortName}.${value}`,
  );
  settings.push(...affectedSettings);
  settings.push(...standardSettings);
  return settings;
}

export function checkIfPeacockSettingsChanged(e: vscode.ConfigurationChangeEvent) {
  return getAllSettingNames().some(setting => e.affectsConfiguration(setting));
}

function collectTitleBarSettings(backgroundHex: string, keepForegroundColor: boolean) {
  const titleBarSettings = {} as ISettingsIndexer;
  if (isAffectedSettingSelected(AffectedSettings.TitleBar)) {
    const titleBarStyle = getElementStyle(backgroundHex, ElementNames.titleBar);
    titleBarSettings[ColorSettings.titleBar_activeBackground] = titleBarStyle.backgroundHex;
    titleBarSettings[ColorSettings.titleBar_inactiveBackground] =
      titleBarStyle.inactiveBackgroundHex;

    if (!keepForegroundColor) {
      titleBarSettings[ColorSettings.titleBar_activeForeground] = titleBarStyle.foregroundHex;
      titleBarSettings[ColorSettings.titleBar_inactiveForeground] =
        titleBarStyle.inactiveForegroundHex;
    }
  }
  return titleBarSettings;
}

function collectActivityBarSettings(
  backgroundHex: string,
  keepForegroundColor: boolean,
  keepBadgeColor: boolean,
) {
  const activityBarSettings = {} as ISettingsIndexer;

  if (isAffectedSettingSelected(AffectedSettings.ActivityBar)) {
    const activityBarStyle = getElementStyle(backgroundHex, ElementNames.activityBar);
    activityBarSettings[ColorSettings.activityBar_background] = activityBarStyle.backgroundHex;
    activityBarSettings[ColorSettings.activityBar_activeBorder] =
      activityBarStyle.badgeBackgroundHex;

    if (!keepForegroundColor) {
      activityBarSettings[ColorSettings.activityBar_foreground] = activityBarStyle.foregroundHex;
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

function collectStatusBarSettings(backgroundHex: string, keepForegroundColor: boolean) {
  const statusBarSettings = {} as ISettingsIndexer;
  if (isAffectedSettingSelected(AffectedSettings.StatusBar)) {
    const statusBarStyle = getElementStyle(backgroundHex, ElementNames.statusBar);
    statusBarSettings[ColorSettings.statusBar_background] = statusBarStyle.backgroundHex;
    statusBarSettings[ColorSettings.statusBarItem_hoverBackground] =
      statusBarStyle.backgroundHoverHex;

    if (!keepForegroundColor) {
      statusBarSettings[ColorSettings.statusBar_foreground] = statusBarStyle.foregroundHex;
    }
  }
  return statusBarSettings;
}

function collectAccentBorderSettings(backgroundHex: string) {
  const accentBorderSettings = {} as ISettingsIndexer;

  // use same adjustments and activity bar
  const { backgroundHex: color } = getElementStyle(backgroundHex, ElementNames.activityBar);

  if (isAffectedSettingSelected(AffectedSettings.AccentBorders)) {
    accentBorderSettings[ColorSettings.accentBorders_panelBorder] = color;
    accentBorderSettings[ColorSettings.accentBorders_sideBarBorder] = color;
    accentBorderSettings[ColorSettings.accentBorders_editorGroupBorder] = color;
  }
  if (isAffectedSettingSelected(AffectedSettings.TabActiveBorder)) {
    accentBorderSettings[ColorSettings.tabActiveBorder] = color;
  }
  return accentBorderSettings;
}

function getElementColors(
  config: vscode.WorkspaceConfiguration | ISettingsIndexer,
): IElementColors {
  return {
    [ElementNames.activityBar]: config[ColorSettings.activityBar_background],
    [ElementNames.statusBar]: config[ColorSettings.statusBar_background],
    [ElementNames.titleBar]: config[ColorSettings.titleBar_activeBackground],
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

export function getWorkspaceColorIfExists() {
  // Get the workspace color customizations
  const config = getColorCustomizationConfigFromWorkspace();

  // Pull out just the three main colors from the workspace
  const elementColors = {
    [ElementNames.activityBar]: config[ColorSettings.activityBar_background],
    [ElementNames.statusBar]: config[ColorSettings.statusBar_background],
    [ElementNames.titleBar]: config[ColorSettings.titleBar_activeBackground],
  };

  if (!elementColors.activityBar && !elementColors.statusBar && !elementColors.titleBar) {
    // There is no color
    return undefined;
  }

  // Get the adjustments so we can reverse the affects of them
  const elementAdjustments = getElementAdjustments();

  // Calculate the colors without the adjustments
  const originalElementColors: IElementColors = {
    [ElementNames.activityBar]: getOriginalColor(
      elementColors[ElementNames.activityBar],
      elementAdjustments[ElementNames.activityBar],
    ),
    [ElementNames.statusBar]: getOriginalColor(
      elementColors[ElementNames.statusBar],
      elementAdjustments[ElementNames.statusBar],
    ),
    [ElementNames.titleBar]: getOriginalColor(
      elementColors[ElementNames.titleBar],
      elementAdjustments[ElementNames.titleBar],
    ),
  };

  // We just want one color, so we an realistically calculate what that color is
  const color =
    originalElementColors.activityBar ||
    originalElementColors.statusBar ||
    originalElementColors.titleBar;

  return color;
}

export function getOriginalColorsForAllElements() {
  const config = getColorCustomizationConfig();
  // const config = getColorCustomizationConfigFromWorkspace(); // TODO: do we always only want workspac colors?

  // Pull out just the three main colors from the workspace
  const elementColors = getElementColors(config);

  const elementAdjustments = getElementAdjustments();

  const originalElementColors: IElementColors = {
    [ElementNames.activityBar]: getOriginalColor(
      elementColors[ElementNames.activityBar],
      elementAdjustments[ElementNames.activityBar],
    ),
    [ElementNames.statusBar]: getOriginalColor(
      elementColors[ElementNames.statusBar],
      elementAdjustments[ElementNames.statusBar],
    ),
    [ElementNames.titleBar]: getOriginalColor(
      elementColors[ElementNames.titleBar],
      elementAdjustments[ElementNames.titleBar],
    ),
  };
  return originalElementColors;
}

export function hasFavorites() {
  const s = getAllUserSettings();
  return s.favoriteColors.values.length;
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
    titleBar: affectTitleBar,
    accentBorders: affectAccentBorders,
    tabActiveBorder: affectTabActiveBorder,
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
    affectTitleBar,
    affectAccentBorders,
    affectTabActiveBorder,
  };
}

function getOriginalColor(color: string, adjustment: ColorAdjustment) {
  if (!color) return color;

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
