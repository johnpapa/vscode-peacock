// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {
  Commands,
  State,
  StandardSettings,
  extensionShortName,
  getExtension
} from './models';
import {
  resetColorsHandler,
  enterColorHandler,
  changeColorToRandomHandler,
  changeColorToPeacockGreenHandler,
  changeColorToFavoriteHandler,
  saveColorToFavoritesHandler,
  addRecommendedFavoritesHandler,
  darkenHandler,
  lightenHandler
} from './commands';
import {
  checkIfPeacockSettingsChanged,
  getCurrentColorBeforeAdjustments,
  getSurpriseMeOnStartup,
  writeRecommendedFavoriteColors
} from './configuration';
import { changeColor } from './color-library';
import { Logger } from './logging';
import { addLiveShareIntegration } from './live-share';
import { addRemoteIntegration } from './remote';
import {
  saveFavoritesVersionMemento,
  getFavoritesVersionMemento
} from './mementos';
import { setExtensionContext, extensionContext } from './extension-context';

const { commands, workspace } = vscode;

export async function activate(context: vscode.ExtensionContext) {
  Logger.info(
    `${extensionShortName}: Extension "vscode-peacock" is now active!`
  );

  setExtensionContext(context);

  registerCommands();
  addSubscriptions();
  await initializeTheStarterSetOfFavorites();
  await applyInitialConfiguration();

  addLiveShareIntegration();
  addRemoteIntegration();
}

function addSubscriptions() {
  extensionContext.subscriptions.push(Logger.getChannel());

  extensionContext.subscriptions.push(
    workspace.onDidChangeConfiguration(applyPeacock())
  );
}

function applyPeacock(): (e: vscode.ConfigurationChangeEvent) => any {
  return async e => {
    if (checkIfPeacockSettingsChanged(e) && State.recentColor) {
      Logger.info(
        `${extensionShortName}: Configuration changed. Changing the color to most recently selected color: ${
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
    Commands.changeColorToPeacockGreen,
    changeColorToPeacockGreenHandler
  );
  commands.registerCommand(
    Commands.changeColorToFavorite,
    changeColorToFavoriteHandler
  );
  commands.registerCommand(Commands.darken, darkenHandler);
  commands.registerCommand(Commands.lighten, lightenHandler);
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
  Logger.info(
    `${extensionShortName}: Extension "vscode-peacock" is now deactive`
  );
}

async function initializeTheStarterSetOfFavorites() {
  let extension = getExtension();
  let version = extension ? extension.packageJSON.version : '';
  let starterSetOfFavoritesVersion = getFavoritesVersionMemento();

  if (starterSetOfFavoritesVersion !== version) {
    saveFavoritesVersionMemento(version);
    await writeRecommendedFavoriteColors();
  } else {
    let msg = `${extensionShortName}: already wrote the favorite colors once`;
    Logger.info(msg);
  }
}
