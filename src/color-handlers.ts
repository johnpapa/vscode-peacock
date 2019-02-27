import * as vscode from 'vscode';
const { workspace } = vscode;

import {
  BuiltInColors,
  ColorSettings,
  Settings,
  ForegroundColors,
  Sections
} from './enums';

// Create the handlers for the commands
export async function resetColorsHandler() {
  // Domain of all color settings we affect
  const colorCustomizations = workspace
    .getConfiguration()
    .get('workbench.colorCustomizations');

  const newColorCustomizations: any = {
    ...colorCustomizations
  };
  Object.values(ColorSettings).forEach(setting => {
    delete newColorCustomizations[setting];
  });

  return await workspace
    .getConfiguration()
    .update('workbench.colorCustomizations', newColorCustomizations, false);
}

export async function changeColorHandler() {
  const backgroundHex = await promptForHexColor();
  if (!isValidHexColor(backgroundHex)) {
    return;
  }
  const foregroundHex = formatHex(invertColor(backgroundHex));
  await changeColorSetting(backgroundHex, foregroundHex);
}

export async function changeColorToRandomHandler() {
  const backgroundHex = generateRandomHexColor();
  const foregroundHex = formatHex(invertColor(backgroundHex));
  await changeColorSetting(backgroundHex, foregroundHex);
}

export async function changeColorToVueGreenHandler() {
  const backgroundHex = BuiltInColors.Vue;
  const foregroundHex = formatHex(invertColor(backgroundHex));
  return await changeColorSetting(backgroundHex, foregroundHex);
}

export async function changeColorToAngularRedHandler() {
  const backgroundHex = BuiltInColors.Angular;
  const foregroundHex = formatHex(invertColor(backgroundHex));
  await changeColorSetting(backgroundHex, foregroundHex);
}

export async function changeColorToReactBlueHandler() {
  const backgroundHex = BuiltInColors.React;
  const foregroundHex = formatHex(invertColor(backgroundHex));
  await changeColorSetting(backgroundHex, foregroundHex);
}

export async function changeColorSetting(
  backgroundHex: string,
  foregroundHex: string
) {
  const colorCustomizations = workspace
    .getConfiguration()
    .get('workbench.colorCustomizations');

  let newSettings = {
    titleBarSettings: {},
    activityBarSettings: {},
    statusBarSettings: {}
  };

  if (isSelected('titleBar')) {
    newSettings.titleBarSettings = {
      [ColorSettings.titleBar_activeBackground]: backgroundHex,
      [ColorSettings.titleBar_activeForeground]: foregroundHex,
      [ColorSettings.titleBar_inactiveBackground]: backgroundHex,
      [ColorSettings.titleBar_inactiveForeground]: foregroundHex
    };
  }

  if (isSelected('activityBar')) {
    newSettings.activityBarSettings = {
      [ColorSettings.activityBar_background]: backgroundHex,
      [ColorSettings.activityBar_foreground]: foregroundHex,
      [ColorSettings.activityBar_inactiveForeground]: foregroundHex
    };
  }

  if (isSelected('statusBar')) {
    newSettings.statusBarSettings = {
      [ColorSettings.statusBar_background]: backgroundHex,
      [ColorSettings.statusBar_foreground]: foregroundHex
    };
  }

  // Merge all color settings
  const newColorCustomizations = {
    ...colorCustomizations,
    ...newSettings.activityBarSettings,
    ...newSettings.titleBarSettings,
    ...newSettings.statusBarSettings
  };

  return await workspace
    .getConfiguration()
    .update('workbench.colorCustomizations', newColorCustomizations, false);
}

export async function promptForHexColor() {
  const options: vscode.InputBoxOptions = {
    ignoreFocusOut: true,
    placeHolder: BuiltInColors.Vue,
    prompt: 'Enter a background color for the title bar in RGB hex format',
    value: BuiltInColors.Vue
  };
  const input = await vscode.window.showInputBox(options);
  const hexInput = formatHex(input);
  return hexInput;
}

export function invertColor(hex: string) {
  // credit: https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
  if (hex.indexOf('#') === 0) {
    hex = hex.slice(1);
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6) {
    throw new Error(`Invalid HEX color ${hex}`);
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  const useDark = r * 0.299 + g * 0.587 + b * 0.114 > 186;

  let foreground = useDark ? getDarkForeground() : getLightForeground();

  // credit: http://stackoverflow.com/a/3943023/112731
  return foreground;
}

function getDarkForeground() {
  const foregroundOverride = readConfiguration<string>(Settings.darkForeground);
  return foregroundOverride || ForegroundColors.DarkForeground;
}

function getLightForeground() {
  const foregroundOverride = readConfiguration<string>(
    Settings.lightForeground
  );
  return foregroundOverride || ForegroundColors.LightForeground;
}

export function isValidHexColor(input: string) {
  return /^#[0-9A-F]{6}$/i.test(input);
}

export function formatHex(input: string = '') {
  return input.substr(0, 1) === '#' ? input : `#${input}`;
}

export function generateRandomHexColor() {
  // credit: https://www.paulirish.com/2009/random-hex-color-code-snippets/
  const hex = (
    '000000' + Math.floor(Math.random() * 16777215).toString(16)
  ).slice(-6);
  return '#' + hex;
}

export function isSelected(setting: string) {
  const affectedElements = readConfiguration<string[]>(
    Settings.affectedElements,
    []
  );

  // check if they requested a setting
  const itExists: boolean = !!(
    affectedElements && affectedElements.includes(setting)
  );

  return itExists;
}

export function readWorkspaceConfiguration<T>(
  colorSettings: ColorSettings,
  defaultValue?: T | undefined
) {
  // const value = workspace.getConfiguration(Sections.workspacePeacockSection);
  // // .get<T | undefined>(colorSettings, defaultValue);
  // return value.get(colorSettings) || defaultValue;

  const value: T | undefined = workspace
    .getConfiguration(Sections.workspacePeacockSection)
    .get<T | undefined>(colorSettings, defaultValue);
  return value as T;
}

export function readConfiguration<T>(
  setting: Settings,
  defaultValue?: T | undefined
) {
  // const value: any = workspace.getConfiguration(Sections.userPeacockSection);
  // return value[setting] || defaultValue;
  const value: T | undefined = workspace
    .getConfiguration(Sections.userPeacockSection)
    .get<T | undefined>(setting, defaultValue);
  return value as T;
}
