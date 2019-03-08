export enum StandardSettings {
  PreferredColors = 'preferredColors',
  ElementAdjustments = 'elementAdjustments',
  KeepForegroundColor = 'keepForegroundColor'
}

export enum AffectedSettings {
  ActivityBar = 'affectActivityBar',
  StatusBar = 'affectStatusBar',
  TitleBar = 'affectTitleBar'
}

export type AllSettings = StandardSettings | AffectedSettings;

export enum Commands {
  resetColors = 'peacock.resetColors',
  enterColor = 'peacock.enterColor',
  changeColorToRandom = 'peacock.changeColorToRandom',
  changeColorToVueGreen = 'peacock.changeColorToVueGreen',
  changeColorToAngularRed = 'peacock.changeColorToAngularRed',
  changeColorToReactBlue = 'peacock.changeColorToReactBlue',
  changeColorToPreferred = 'peacock.changeColorToPreferred'
}

export enum ColorSettings {
  titleBar_activeBackground = 'titleBar.activeBackground',
  titleBar_activeForeground = 'titleBar.activeForeground',
  titleBar_inactiveBackground = 'titleBar.inactiveBackground',
  titleBar_inactiveForeground = 'titleBar.inactiveForeground',
  activityBar_background = 'activityBar.background',
  activityBar_foreground = 'activityBar.foreground',
  activityBar_inactiveForeground = 'activityBar.inactiveForeground',
  statusBar_background = 'statusBar.background',
  statusBar_foreground = 'statusBar.foreground',
  statusBarItem_hoverBackground = 'statusBarItem.hoverBackground'
}

export type ColorAdjustment = 'lighten' | 'darken' | 'none';

export enum ColorAdjustmentOptions {
  'lighten' = 'lighten',
  'darken' = 'darken',
  'none' = 'none'
}

export enum BuiltInColors {
  Vue = '#42b883',
  Angular = '#b52e31',
  React = '#00b3e6'
}

export enum Sections {
  workspacePeacockSection = 'workbench.colorCustomizations',
  userPeacockSection = 'peacock'
}

export enum ForegroundColors {
  DarkForeground = '#15202b',
  LightForeground = '#e7e7e7'
}
