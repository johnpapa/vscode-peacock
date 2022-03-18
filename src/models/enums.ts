import { LiveShareSettings } from '../live-share';

export enum StandardSettings {
  Color = 'color',
  DarkenLightenPercentage = 'darkenLightenPercentage',
  DarkForegroundColor = 'darkForegroundColor',
  ElementAdjustments = 'elementAdjustments',
  FavoriteColors = 'favoriteColors',
  KeepBadgeColor = 'keepBadgeColor',
  KeepForegroundColor = 'keepForegroundColor',
  LightForegroundColor = 'lightForegroundColor',
  RemoteColor = 'remoteColor',
  SameRemoteLocalColor = 'sameRemoteLocalColor',
  ShowColorInStatusBar = 'showColorInStatusBar',
  SurpriseMeFromFavoritesOnly = 'surpriseMeFromFavoritesOnly',
  SurpriseMeOnStartup = 'surpriseMeOnStartup',
}

export enum AffectedSettings {
  EditorGroupBorder = 'affectEditorGroupBorder',
  PanelBorder = 'affectPanelBorder',
  SideBarBorder = 'affectSideBarBorder',
  SashHover = 'affectSashHover',
  ActivityBar = 'affectActivityBar',
  DebuggingStatusBar = 'affectDebuggingStatusBar',
  StatusBar = 'affectStatusBar',
  StatusAndTitleBorders = 'affectStatusAndTitleBorders',
  TabActiveBorder = 'affectTabActiveBorder',
  TitleBar = 'affectTitleBar',
}

export type AllSettings = StandardSettings | AffectedSettings | LiveShareSettings;

export enum Commands {
  addRecommendedFavorites = 'peacock.addRecommendedFavorites',
  changeColorToRandom = 'peacock.changeColorToRandom',
  changeColorToPeacockGreen = 'peacock.changeColorToPeacockGreen',
  changeColorToFavorite = 'peacock.changeColorToFavorite',
  darken = 'peacock.darken',
  enterColor = 'peacock.enterColor',
  lighten = 'peacock.lighten',
  removeAllColors = 'peacock.removeAllColors',
  resetWorkspaceColors = 'peacock.resetWorkspaceColors',
  saveColorToFavorites = 'peacock.saveColorToFavorites',
  showAndCopyCurrentColor = 'peacock.showAndCopyCurrentColor',
  showDocumentation = 'peacock.docs',
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
  editorGroupBorder = 'editorGroup.border',
  panelBorder = 'panel.border',
  sideBarBorder = 'sideBar.border',
  sashHover = 'sash.hoverBorder',
  statusBar_border = 'statusBar.border',
  statusBar_background = 'statusBar.background',
  statusBar_foreground = 'statusBar.foreground',
  statusBar_debuggingBorder = 'statusBar.debuggingBorder',
  statusBar_debuggingBackground = 'statusBar.debuggingBackground',
  statusBar_debuggingForeground = 'statusBar.debuggingForeground',
  statusBarItem_hoverBackground = 'statusBarItem.hoverBackground',
  statusBarItem_remoteBackground = 'statusBarItem.remoteBackground',
  statusBarItem_remoteForeground = 'statusBarItem.remoteForeground',
  tabActiveBorder = 'tab.activeBorder',
  titleBar_activeBackground = 'titleBar.activeBackground',
  titleBar_activeForeground = 'titleBar.activeForeground',
  titleBar_border = 'titleBar.border',
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
