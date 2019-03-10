import * as vscode from 'vscode';
import {
  isValidColorInput,
  getRandomColorHex,
  changeColor
} from './color-library';

import { BuiltInColors, ColorSettings, state } from './models';
import { changeColorSetting } from './configuration';
import { promptForColor, promptForPreferredColor } from './inputs';

const { workspace } = vscode;

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

  state.recentColor = '';

  return changeColorSetting(newColorCustomizations);
}

export async function saveColorHandler() {
  // retrieve current background color
  // prompt user to enter a name for the color
  // add to their user settings.json
  // const color = getOriginalColorBeforeAdjustments();
  // const input = await promptForPreferredName();
  // if (!input) {
  //   return;
  // }
  // return await saveColor(input, color);
}

export async function enterColorHandler() {
  const input = await promptForColor();
  if (!isValidColorInput(input)) {
    throw new Error(`Invalid HEX or named color "${input}"`);
  }

  return await changeColor(input);
}

export async function changeColorToRandomHandler() {
  return await changeColor(getRandomColorHex());
}

export async function changeColorToVueGreenHandler() {
  return await changeColor(BuiltInColors.Vue);
}

export async function changeColorToAngularRedHandler() {
  return await changeColor(BuiltInColors.Angular);
}

export async function changeColorToReactBlueHandler() {
  return await changeColor(BuiltInColors.React);
}

export async function changeColorToPreferredHandler() {
  const input = await promptForPreferredColor();
  if (isValidColorInput(input)) {
    await changeColor(input);
  }
}
