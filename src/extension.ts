// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {
  Commands,
  State,
  StandardSettings,
  extensionShortName
} from './models';
import {
  resetColorsHandler,
  enterColorHandler,
  changeColorToRandomHandler,
  changeColorToVueGreenHandler,
  changeColorToAngularRedHandler,
  changeColorToReactBlueHandler,
  changeColorToFavoriteHandler,
  saveColorToFavoritesHandler,
  addRecommendedFavoritesHandler
} from './commands';
import {
  checkIfPeacockSettingsChanged,
  getCurrentColorBeforeAdjustments,
  getSurpriseMeOnStartup,
  writeRecommendedFavoriteColors
} from './configuration';
import { changeColor } from './color-library';
import { Logger } from './logging';
import { getExtension } from './test/lib/helpers';

const { commands, workspace } = vscode;

export async function activate(context: vscode.ExtensionContext) {
  console.log('Extension "vscode-peacock" is now active!');

  registerCommands();
  addSubscriptions(context);
  await initializeTheStarterSetOfFavorites(context);
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
    Commands.addRecommendedFavorites,
    addRecommendedFavoritesHandler
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

async function initializeTheStarterSetOfFavorites(
  context: vscode.ExtensionContext
) {
  let extension = getExtension();
  let version = extension ? extension.packageJSON.version : '';
  const key = `${extensionShortName}.starterSetOfFavoritesVersion`;
  let starterSetOfFavoritesVersion = context.globalState.get(key, undefined);

  if (starterSetOfFavoritesVersion !== version) {
    context.globalState.update(key, version);
    await writeRecommendedFavoriteColors();
  } else {
    let msg = `${extensionShortName}: already wrote the favorite colors once`;
    Logger.info(msg);
  }
}
