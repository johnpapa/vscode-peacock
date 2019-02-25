// Constants
export const extSuffix = 'peacock';

// Enums
export enum Elements {
  'affectedElements' = 'affectedElements'
}

export enum Commands {
  'resetColors' = 'peacock.resetColors',
  'changeColor' = 'peacock.changeColor',
  'changeColorToRandom' = 'peacock.changeColorToRandom',
  'changeColorToVueGreen' = 'peacock.changeColorToVueGreen',
  'changeColorToAngularRed' = 'peacock.changeColorToAngularRed',
  'changeColorToReactBlue' = 'peacock.changeColorToReactBlue'
}

export enum ColorSettings {
  'titleBar_activeBackground' = 'titleBar.activeBackground',
  'titleBar_activeForeground' = 'titleBar.activeForeground',
  'titleBar_inactiveBackground' = 'titleBar.inactiveBackground',
  'titleBar_inactiveForeground' = 'titleBar.inactiveForeground',
  'activityBar_background' = 'activityBar.background',
  'activityBar_foreground' = 'activityBar.foreground',
  'activityBar_inactiveForeground' = 'activityBar.inactiveForeground',
  'statusBar_background' = 'statusBar.background',
  'statusBar_foreground' = 'statusBar.foreground'
}

export enum BuiltInColors {
  Vue = '#42b883',
  Angular = '#b52e31',
  React = '#00b3e6'
}
