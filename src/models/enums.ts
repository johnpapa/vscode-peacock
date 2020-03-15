import { LiveShareSettings } from '../live-share';

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
  RemoteColor = 'remoteColor',
  Color = 'color',
  CacheBust = 'cacheBust',
}

export enum AffectedSettings {
  ActivityBar = 'affectActivityBar',
  StatusBar = 'affectStatusBar',
  TitleBar = 'affectTitleBar',
  AccentBorders = 'affectAccentBorders',
  TabActiveBorder = 'affectTabActiveBorder',
}

export type AllSettings = StandardSettings | AffectedSettings | LiveShareSettings;

export enum Commands {
  showDocumentation = 'peacock.docs',
  resetWorkspaceColors = 'peacock.resetWorkspaceColors',
  removeAllColors = 'peacock.removeAllColors',
  saveColorToFavorites = 'peacock.saveColorToFavorites',
  enterColor = 'peacock.enterColor',
  changeColorToRandom = 'peacock.changeColorToRandom',
  changeColorToPeacockGreen = 'peacock.changeColorToPeacockGreen',
  changeColorToFavorite = 'peacock.changeColorToFavorite',
  addRecommendedFavorites = 'peacock.addRecommendedFavorites',
  darken = 'peacock.darken',
  lighten = 'peacock.lighten',
  showAndCopyCurrentColor = 'peacock.showAndCopyCurrentColor',
}

export enum ElementNames {
  activityBar = 'activityBar',
  statusBar = 'statusBar',
  titleBar = 'titleBar',
}

export enum ColorSettings {
  activityBar_activeBackground = 'activityBar.activeBackground',
  activityBar_activeBorder = 'activityBar.activeBorder',
  activityBar_background = 'activityBar.background',
  activityBar_foreground = 'activityBar.foreground',
  activityBar_inactiveForeground = 'activityBar.inactiveForeground',
  activityBar_badgeBackground = 'activityBarBadge.background',
  activityBar_badgeForeground = 'activityBarBadge.foreground',
  accentBorders_editorGroupBorder = 'editorGroup.border',
  accentBorders_panelBorder = 'panel.border',
  statusBar_background = 'statusBar.background',
  accentBorders_sideBarBorder = 'sideBar.border',
  statusBar_foreground = 'statusBar.foreground',
  statusBarItem_hoverBackground = 'statusBarItem.hoverBackground',
  tabActiveBorder = 'tab.activeBorder',
  titleBar_activeBackground = 'titleBar.activeBackground',
  titleBar_activeForeground = 'titleBar.activeForeground',
  titleBar_inactiveBackground = 'titleBar.inactiveBackground',
  titleBar_inactiveForeground = 'titleBar.inactiveForeground',
}

export type ColorAdjustment = 'lighten' | 'darken' | 'none';

export enum ColorAdjustmentOptions {
  lighten = 'lighten',
  darken = 'darken',
  none = 'none',
}

export enum Sections {
  peacockColorCustomizationSection = 'workbench.colorCustomizations',
  peacockSection = 'peacock',
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

export enum ColorSource {
  WorkspaceValue = 'workspaceValue',
  GlobalValue = 'globalValue',
  DefaultValue = 'defaultValue',
  None = 'none',
}
