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
  saveFavoritesVersionGlobalMemento,
  getFavoritesVersionGlobalMemento,
  getMementos
} from './mementos';
import { notify } from './notification';

const { commands, workspace } = vscode;

export async function activate(context: vscode.ExtensionContext) {
  State.extensionContext = context;
  Logger.info(
    `${extensionShortName}: Extension "vscode-peacock" is now active!`
  );
  Logger.info(getMementos(), true, 'Mementos');

  registerCommands();
  addSubscriptions();
  await initializeTheStarterSetOfFavorites();
  await applyInitialConfiguration();

  await addLiveShareIntegration(State.extensionContext);
  await addRemoteIntegration(State.extensionContext);
}

function addSubscriptions() {
  State.extensionContext.subscriptions.push(Logger.getChannel());

  State.extensionContext.subscriptions.push(
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

  await checkSurpriseMeOnStartupLogic();
}

export function deactivate() {
  Logger.info(
    `${extensionShortName}: Extension "vscode-peacock" is now deactive`
  );
}

async function initializeTheStarterSetOfFavorites() {
  let starterSetOfFavoritesVersion = getFavoritesVersionGlobalMemento();

  if (starterSetOfFavoritesVersion !== State.extensionVersion) {
    saveFavoritesVersionGlobalMemento(State.extensionVersion);
    await writeRecommendedFavoriteColors();
  } else {
    let msg = `${extensionShortName}: Already wrote the favorite colors once`;
    Logger.info(msg);
  }
}

async function checkSurpriseMeOnStartupLogic() {
  /**
   * If the "surprise me on startup" setting is true
   * and there is no peacock color set, then choose a new random color.
   * We do not choose a random color if there is already a color set
   * as this would prevent users from choosing a specific color for
   * some workspaces and surprise in others.
   */
  if (getSurpriseMeOnStartup()) {
    if (State.recentColor) {
      const message = `Peacock did not change the color using "surprise me on startup" because the color ${
        State.recentColor
      } was already set. If you wish to choose a new color on startup, please reset your current colors.`;
      Logger.info(message);
      return;
    }

    await changeColorToRandomHandler();
    const color = getCurrentColorBeforeAdjustments();
    const message = `Peacock changed the base accent colors to ${color}, because the setting is enabled for ${
      StandardSettings.SurpriseMeOnStartup
    }`;
    Logger.info(message);
  }
}
