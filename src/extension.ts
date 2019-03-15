// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Commands, State, StandardSettings } from './models';
import {
  resetColorsHandler,
  enterColorHandler,
  changeColorToRandomHandler,
  changeColorToVueGreenHandler,
  changeColorToAngularRedHandler,
  changeColorToReactBlueHandler,
  changeColorToFavoriteHandler,
  saveColorToFavoritesHandler
} from './commands';
import {
  checkIfPeacockSettingsChanged,
  getCurrentColorBeforeAdjustments,
  getSurpriseMeOnStartup
} from './configuration';
import { changeColor } from './color-library';
import { Logger } from './logging';

const { commands, workspace } = vscode;

export async function activate(context: vscode.ExtensionContext) {
  console.log('Extension "vscode-peacock" is now active!');

  registerCommands();
  addSubscriptions(context);
  await applyInitialConfiguration();
}

function addSubscriptions(context: vscode.ExtensionContext) {
  context.subscriptions.push(Logger.getChannel());

  context.subscriptions.push(
    workspace.onDidChangeConfiguration(applyPeacock())
  );
}

function applyPeacock(): (e: vscode.ConfigurationChangeEvent) => any {
  return async e => {
    if (checkIfPeacockSettingsChanged(e) && State.recentColor) {
      Logger.info(
        `Configuration changed. Changing the color to most recently selected color: ${
          State.recentColor
        }`
      );
      await changeColor(State.recentColor);
    }
  };
}

function registerCommands() {
  commands.registerCommand(Commands.resetColors, resetColorsHandler);
  commands.registerCommand(
    Commands.saveColorToFavorites,
    saveColorToFavoritesHandler
  );
  commands.registerCommand(Commands.enterColor, enterColorHandler);
  commands.registerCommand(
    Commands.changeColorToRandom,
    changeColorToRandomHandler
  );
  commands.registerCommand(
    Commands.changeColorToVueGreen,
  changeColorToVueGreenHandler
  );
  commands.registerCommand(
    Commands.changeColorToAngularRed,
    changeColorToAngularRedHandler
  );
  commands.registerCommand(
    Commands.changeColorToReactBlue,
    changeColorToReactBlueHandler
  );
  commands.registerCommand(
    Commands.changeColorToFavorite,
    changeColorToFavoriteHandler
  );
}

export async function applyInitialConfiguration() {
  State.recentColor = getCurrentColorBeforeAdjustments();

  if (!State.recentColor && getSurpriseMeOnStartup()) {
    const color = await changeColorToRandomHandler();
    const message = `Peacock changed the base accent colors to ${color}, because the setting is enabled for ${
      StandardSettings.SurpriseMeOnStartup
    }`;
    vscode.window.showInformationMessage(message);
  }
}

export function deactivate() {
  console.log('Extension "vscode-peacock" is now deactive');
}
