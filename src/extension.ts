// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {
  Commands,
  State,
  StandardSettings,
  extensionShortName,
  getExtensionVersion,
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
  lightenHandler,
  showAndCopyCurrentColorHandler,
} from './commands';
import {
  checkIfPeacockSettingsChanged,
  getSurpriseMeOnStartup,
  writeRecommendedFavoriteColors,
  getEnvironmentAwareColor,
} from './configuration';
import { changeColor } from './color-library';
import { Logger } from './logging';
import { addLiveShareIntegration } from './live-share';
import { addRemoteIntegration } from './remote';
import {
  saveFavoritesVersionGlobalMemento,
  getFavoritesVersionGlobalMemento,
  getMementos,
} from './mementos';

const { commands, workspace } = vscode;

export async function activate(context: vscode.ExtensionContext) {
  State.extensionContext = context;
  Logger.info(`${extensionShortName}: Extension "vscode-peacock" is now active!`);
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

  State.extensionContext.subscriptions.push(workspace.onDidChangeConfiguration(applyPeacock()));
}

function applyPeacock(): (e: vscode.ConfigurationChangeEvent) => any {
  return async e => {
    const color = getEnvironmentAwareColor();
    if (checkIfPeacockSettingsChanged(e) && color) {
      Logger.info(
        `${extensionShortName}: Configuration changed. Changing the color to most recently selected color: ${color}`,
      );
      await changeColor(color);
    }
  };
}

function registerCommands() {
  commands.registerCommand(Commands.resetColors, resetColorsHandler);
  commands.registerCommand(Commands.saveColorToFavorites, saveColorToFavoritesHandler);
  commands.registerCommand(Commands.enterColor, enterColorHandler);
  commands.registerCommand(Commands.changeColorToRandom, changeColorToRandomHandler);
  commands.registerCommand(Commands.addRecommendedFavorites, addRecommendedFavoritesHandler);
  commands.registerCommand(Commands.changeColorToPeacockGreen, changeColorToPeacockGreenHandler);
  commands.registerCommand(Commands.changeColorToFavorite, changeColorToFavoriteHandler);
  commands.registerCommand(Commands.darken, darkenHandler);
  commands.registerCommand(Commands.lighten, lightenHandler);
  commands.registerCommand(Commands.showAndCopyCurrentColor, showAndCopyCurrentColorHandler);
}

export async function applyInitialConfiguration() {
  await checkSurpriseMeOnStartupLogic();
}

export function deactivate() {
  Logger.info(`${extensionShortName}: Extension "vscode-peacock" is now deactive`);
}

async function initializeTheStarterSetOfFavorites() {
  let starterSetOfFavoritesVersion = getFavoritesVersionGlobalMemento();

  // If the version has changed, we write the current set of favorites to user settings.json,
  // merging them with any the user has created on their own
  const currentVersion = getExtensionVersion();
  if (starterSetOfFavoritesVersion !== currentVersion) {
    await writeRecommendedFavoriteColors();
    await saveFavoritesVersionGlobalMemento(currentVersion);
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
   * as this would confuse users who choose a specific color in a
   * workspace and see it changed to the "surprise" color
   */
  const peacockColor = getEnvironmentAwareColor();
  if (getSurpriseMeOnStartup()) {
    if (peacockColor) {
      const message = `Peacock did not change the color using "surprise me on startup" because the color ${peacockColor} was already set.`;
      Logger.info(message);
      return;
    }

    await changeColorToRandomHandler();
    const color = getEnvironmentAwareColor();
    const message = `Peacock changed the base accent colors to ${color}, because the setting is enabled for ${StandardSettings.SurpriseMeOnStartup}`;
    Logger.info(message);
  }
}
