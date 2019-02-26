import * as vscode from 'vscode';
import { namedColors } from './named-colors';
import {
  isValidHexColor,
  isValidNamedColor
} from "./color-validators";

const { workspace } = vscode;

import {
  BuiltInColors,
  ColorSettings,
  Settings,
  ForegroundColors
} from './enums';

// Create the handlers for the commands
export async function resetColorsHandler() {
  // Domain of all color settings we affect
  const colorCustomizations = await workspace
    .getConfiguration()
    .get('workbench.colorCustomizations');

  const newColorCustomizations: any = {
    ...colorCustomizations
  };
  Object.values(ColorSettings).forEach(setting => {
    delete newColorCustomizations[setting];
  });

  await workspace
    .getConfiguration()
    .update('workbench.colorCustomizations', newColorCustomizations, false);
}

export async function changeColorHandler() {
  const backgroundHex = await promptForHexColor();
  let colorHex: string = '';

  if (isValidHexColor(backgroundHex)) {
    colorHex = backgroundHex;
  } else if (isValidNamedColor(backgroundHex)) {
    colorHex = namedColors[backgroundHex.substr(1).toLowerCase()];
  }

  if (!colorHex) {
    return;
  }

  const foregroundHex = formatHex(await invertColor(colorHex));
  changeColorSetting(colorHex, foregroundHex);
}

export async function changeColorToRandomHandler() {
  const backgroundHex = generateRandomHexColor();
  const foregroundHex = formatHex(await invertColor(backgroundHex));
  changeColorSetting(backgroundHex, foregroundHex);
}

export async function changeColorToVueGreenHandler() {
  const backgroundHex = BuiltInColors.Vue;
  const foregroundHex = formatHex(await invertColor(backgroundHex));
  changeColorSetting(backgroundHex, foregroundHex);
}

export async function changeColorToAngularRedHandler() {
  const backgroundHex = BuiltInColors.Angular;
  const foregroundHex = formatHex(await invertColor(backgroundHex));
  changeColorSetting(backgroundHex, foregroundHex);
}

export async function changeColorToReactBlueHandler() {
  const backgroundHex = BuiltInColors.React;
  const foregroundHex = formatHex(await invertColor(backgroundHex));
  changeColorSetting(backgroundHex, foregroundHex);
}

export async function changeColorSetting(
  backgroundHex: string,
  foregroundHex: string
) {
  const colorCustomizations = await workspace
    .getConfiguration()
    .get('workbench.colorCustomizations');

  let newSettings = {
    titleBarSettings: {},
    activityBarSettings: {},
    statusBarSettings: {}
  };

  if (await isSelected('titleBar')) {
    newSettings.titleBarSettings = {
      [ColorSettings.titleBar_activeBackground]: backgroundHex,
      [ColorSettings.titleBar_activeForeground]: foregroundHex,
      [ColorSettings.titleBar_inactiveBackground]: backgroundHex,
      [ColorSettings.titleBar_inactiveForeground]: foregroundHex
    };
  }

  if (await isSelected('activityBar')) {
    newSettings.activityBarSettings = {
      [ColorSettings.activityBar_background]: backgroundHex,
      [ColorSettings.activityBar_foreground]: foregroundHex,
      [ColorSettings.activityBar_inactiveForeground]: foregroundHex
    };
  }

  if (await isSelected('statusBar')) {
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

  await workspace
    .getConfiguration()
    .update('workbench.colorCustomizations', newColorCustomizations, false);
}

export async function promptForHexColor() {
  const options: vscode.InputBoxOptions = {
    ignoreFocusOut: true,
    placeHolder: BuiltInColors.Vue,
    prompt: 'Enter a background color for the title bar in RGB hex format or a valid HTML color name',
    value: BuiltInColors.Vue
  };
  const input = await vscode.window.showInputBox(options);
  const hexInput = formatHex(input);
  return hexInput;
}

export async function invertColor(hex: string) {
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

  let foreground = useDark
    ? await getDarkForeground()
    : await getLightForeground();

  // credit: http://stackoverflow.com/a/3943023/112731
  return foreground;
}

async function getDarkForeground() {
  const foregroundOverride = await readConfiguration<string>(
    Settings.darkForeground
  );
  return foregroundOverride || ForegroundColors.DarkForeground;
}

async function getLightForeground() {
  const foregroundOverride = await readConfiguration<string>(
    Settings.lightForeground
  );
  return foregroundOverride || ForegroundColors.LightForeground;
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

export async function isSelected(setting: string) {
  const affectedElements = await readConfiguration<string[]>(
    Settings.affectedElements,
    []
  );

  // check if they requested a setting
  const itExists: boolean = !!(
    affectedElements && affectedElements.includes(setting)
  );

  return itExists;
}

async function readConfiguration<T>(
  setting: Settings,
  defaultValue?: T | undefined
) {
  const value: T | undefined = await workspace
    .getConfiguration('peacock')
    .get<T | undefined>(setting, defaultValue);
  return value as T;
}
