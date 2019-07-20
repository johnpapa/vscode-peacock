export enum StandardSettings {
  ElementAdjustments = 'elementAdjustments',
  FavoriteColors = 'favoriteColors',
  KeepBadgeColor = 'keepBadgeColor',
  KeepForegroundColor = 'keepForegroundColor',
  DarkForegroundColor = 'darkForegroundColor',
  LightForegroundColor = 'lightForegroundColor',
  DarkenLightenPercentage = 'darkenLightenPercentage',
  ShowColorInStatusBar = 'showColorInStatusBar',
  SurpriseMeFromFavoritesOnly = 'surpriseMeFromFavoritesOnly',
  SurpriseMeOnStartup = 'surpriseMeOnStartup',
}

export enum AffectedSettings {
  ActivityBar = 'affectActivityBar',
  StatusBar = 'affectStatusBar',
  TitleBar = 'affectTitleBar',
}

export type AllSettings = StandardSettings | AffectedSettings;

export enum Commands {
  resetColors = 'peacock.resetColors',
  saveColorToFavorites = 'peacock.saveColorToFavorites',
  enterColor = 'peacock.enterColor',
  changeColorToRandom = 'peacock.changeColorToRandom',
  changeColorToPeacockGreen = 'peacock.changeColorToPeacockGreen',
  changeColorToFavorite = 'peacock.changeColorToFavorite',
  addRecommendedFavorites = 'peacock.addRecommendedFavorites',
  darken = 'peacock.darken',
  lighten = 'peacock.lighten',
}

export enum ElementNames {
  activityBar = 'activityBar',
  statusBar = 'statusBar',
  titleBar = 'titleBar',
}

export enum ColorSettings {
  titleBar_activeBackground = 'titleBar.activeBackground',
  titleBar_activeForeground = 'titleBar.activeForeground',
  titleBar_inactiveBackground = 'titleBar.inactiveBackground',
  titleBar_inactiveForeground = 'titleBar.inactiveForeground',
  activityBar_background = 'activityBar.background',
  activityBar_foreground = 'activityBar.foreground',
  activityBar_inactiveForeground = 'activityBar.inactiveForeground',
  activityBar_badgeBackground = 'activityBarBadge.background',
  activityBar_badgeForeground = 'activityBarBadge.foreground',
  statusBar_background = 'statusBar.background',
  statusBar_foreground = 'statusBar.foreground',
  statusBarItem_hoverBackground = 'statusBarItem.hoverBackground',
}

export type ColorAdjustment = 'lighten' | 'darken' | 'none';

export enum ColorAdjustmentOptions {
  lighten = 'lighten',
  darken = 'darken',
  none = 'none',
}

export enum Sections {
  workspacePeacockSection = 'workbench.colorCustomizations',
  userPeacockSection = 'peacock',
}

export enum ForegroundColors {
  DarkForeground = '#15202b',
  LightForeground = '#e7e7e7',
}

// See WebAIM contrast guidelines: https://webaim.org/articles/contrast/
export enum ReadabilityRatios {
  UserInterfaceLow = 2,
  UserInterface = 3,
  Text = 4.5,
}
