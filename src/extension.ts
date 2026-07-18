// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {
  Commands,
  State,
  StandardSettings,
  extensionShortName,
  getExtensionVersion,
  ColorSource,
} from './models';
import {
  resetWorkspaceColorsHandler,
  enterColorHandler,
  changeColorToRandomHandler,
  changeColorToPeacockGreenHandler,
  changeColorToFavoriteHandler,
  saveColorToFavoritesHandler,
  addRecommendedFavoritesHandler,
  darkenHandler,
  lightenHandler,
  showAndCopyCurrentColorHandler,
  removeAllPeacockColorsHandler,
  showDocumentationHandler,
  setSideBarDarknessLevelHandler,
} from './commands';
import {
  checkIfPeacockSettingsChanged,
  getSurpriseMeInFavoritesOrder,
  getSurpriseMeFromFavoritesOnly,
  getSurpriseMeOnStartup,
  writeRecommendedFavoriteColors,
  getEnvironmentAwareColor,
  inspectColor,
  getCurrentColorBeforeAdjustments,
  getFavoriteColors,
} from './configuration';
import { applyColor, updateColorSetting } from './apply-color';
import { isValidColorInput } from './color-library';
import { Logger } from './logging';
import { addLiveShareIntegration } from './live-share';
import { addRemoteIntegration } from './remote';
import {
  saveFavoritesVersionGlobalMemento,
  getMementos,
  getSurpriseMeFavoritesOrderIndexGlobalMemento,
  getSurpriseMeFavoritesOrderKeyGlobalMemento,
  saveSurpriseMeFavoritesOrderGlobalMemento,
  getSurpriseMeStartupSelectionsGlobalMemento,
  saveSurpriseMeStartupSelectionGlobalMemento,
} from './mementos';
import type { IFavoriteColors } from './models';

const { commands, workspace } = vscode;

export async function activate(context: vscode.ExtensionContext) {
  State.extensionContext = context;
  // Logger.info(`${extensionShortName}: Extension "vscode-peacock" is now active!`);
  Logger.info(getMementos(), true, 'Peacock Mementos');

  registerCommands();
  await initializeTheStarterSetOfFavorites();

  if (workspace.workspaceFolders) {
    Logger.info('Peacock is in a workspace, so Peacock functionality is available.');
    /**
     * We only run this logic if we are in a workspace
     * because they may write peacock settings, and it will fail.
     * This entire function will re-run when a workspace is opened.
     */
    await checkSurpriseMeOnStartupLogic();
    await addLiveShareIntegration(State.extensionContext);
    await addRemoteIntegration(State.extensionContext);
  } else {
    Logger.info('Peacock is not in a workspace, so Peacock functionality is not available.');
  }

  addSubscriptions(); // add these AFTER applying initial config
}

function addSubscriptions() {
  State.extensionContext.subscriptions.push(Logger.getChannel());

  State.extensionContext.subscriptions.push(workspace.onDidChangeConfiguration(applyPeacock()));
}

function applyPeacock(): (e: vscode.ConfigurationChangeEvent) => any {
  return async e => {
    const color = getEnvironmentAwareColor();
    const appliedColor = getCurrentColorBeforeAdjustments();
    if (checkIfPeacockSettingsChanged(e) && (color || appliedColor)) {
      /**
       * If the settings have changed
       * AND (either we have a peacock.color/remoteColor to apply
       *       OR we have an applied color already in the color customizations),
       * Then we apply the "color"
       */
      Logger.info(
        `${extensionShortName}: Configuration changed. Changing the color to most recently selected color: ${color}`,
      );
      await applyColor(color);

      // Only update the color in the workspace settings
      // if there was already a workspace setting
      const colorSource = inspectColor();
      if (colorSource.colorSource === ColorSource.WorkspaceValue) {
        await updateColorSetting(color);
      }
    }
  };
}

function registerCommands() {
  commands.registerCommand(Commands.showDocumentation, showDocumentationHandler);
  commands.registerCommand(Commands.resetWorkspaceColors, resetWorkspaceColorsHandler);
  commands.registerCommand(Commands.removeAllColors, removeAllPeacockColorsHandler);
  commands.registerCommand(Commands.saveColorToFavorites, saveColorToFavoritesHandler);
  commands.registerCommand(Commands.enterColor, enterColorHandler);
  commands.registerCommand(Commands.changeColorToRandom, changeColorToRandomHandler);
  commands.registerCommand(Commands.addRecommendedFavorites, addRecommendedFavoritesHandler);
  commands.registerCommand(Commands.changeColorToPeacockGreen, changeColorToPeacockGreenHandler);
  commands.registerCommand(Commands.changeColorToFavorite, changeColorToFavoriteHandler);
  commands.registerCommand(Commands.darken, darkenHandler);
  commands.registerCommand(Commands.lighten, lightenHandler);
  commands.registerCommand(Commands.showAndCopyCurrentColor, showAndCopyCurrentColorHandler);
  commands.registerCommand(Commands.affectSideBarBackground, setSideBarDarknessLevelHandler);
}

export function deactivate() {
  // Logger.info(`${extensionShortName}: Extension "vscode-peacock" is now deactive`);
}

async function initializeTheStarterSetOfFavorites() {
  // If the version has changed, we write the current set of favorites to user settings.json,
  // merging them with any the user has created on their own
  const currentVersion = getExtensionVersion();
  // TODO: Revisit how we merge favorites
  // For now we'll just add the starter set of favorites one time.
  // If there are favorites, do not write new ones.
  // We'll revisit this later so we do not overwrite favorites.
  const { values: favoritesValues } = getFavoriteColors();
  if (!favoritesValues.length) {
    await writeRecommendedFavoriteColors();
    await saveFavoritesVersionGlobalMemento(currentVersion);
  }
}

export async function checkSurpriseMeOnStartupLogic() {
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
      await saveCurrentWorkspaceStartupSelection(peacockColor);
      const message = `Peacock did not change the color using "surprise me on startup" because the color ${peacockColor} was already set.`;
      Logger.info(message);
      return;
    }

    const restoredSelectionApplied = await applySavedStartupSelectionForCurrentWorkspace();
    if (!restoredSelectionApplied) {
      const deterministicColorApplied = await applyDeterministicStartupFavoriteColor();
      if (!deterministicColorApplied) {
        await changeColorToRandomHandler();
      }
    }
    const color = getEnvironmentAwareColor();
    await saveCurrentWorkspaceStartupSelection(color);
    const message = `Peacock changed the color to ${color}, because the setting is enabled for ${StandardSettings.SurpriseMeOnStartup}`;
    Logger.info(message);
  }
}

async function applyDeterministicStartupFavoriteColor() {
  if (!getSurpriseMeFromFavoritesOnly() || !getSurpriseMeInFavoritesOrder()) {
    return false;
  }

  const nextFavorite = await getNextFavoriteColorInOrder();
  if (!nextFavorite) {
    return false;
  }

  await applyColor(nextFavorite.value);
  await updateColorSetting(nextFavorite.value);
  return true;
}

async function getNextFavoriteColorInOrder() {
  const { values: favoriteColors } = getFavoriteColors();
  if (!favoriteColors.length) {
    return undefined;
  }

  const currentKey = getFavoriteColorsKey(favoriteColors);
  const previousKey = getSurpriseMeFavoritesOrderKeyGlobalMemento();
  const previousIndex = getSurpriseMeFavoritesOrderIndexGlobalMemento();

  const resetToStart =
    previousKey !== currentKey || previousIndex < 0 || previousIndex >= favoriteColors.length;
  const lastIndex = resetToStart ? -1 : previousIndex;
  const nextIndex = (lastIndex + 1) % favoriteColors.length;

  await saveSurpriseMeFavoritesOrderGlobalMemento(nextIndex, currentKey);
  return favoriteColors[nextIndex];
}

function getFavoriteColorsKey(favoriteColors: IFavoriteColors[]) {
  return favoriteColors
    .map(favoriteColor => `${favoriteColor.name}:${favoriteColor.value.toLowerCase()}`)
    .join('|');
}

async function applySavedStartupSelectionForCurrentWorkspace() {
  const workspaceKey = getStartupWorkspaceKey();
  if (!workspaceKey) {
    return false;
  }

  const startupSelections = getSurpriseMeStartupSelectionsGlobalMemento();
  const startupSelection = startupSelections[workspaceKey];

  if (!startupSelection || !isValidColorInput(startupSelection)) {
    return false;
  }

  await applyColor(startupSelection);
  await updateColorSetting(startupSelection);
  return true;
}

async function saveCurrentWorkspaceStartupSelection(color: string | undefined) {
  const workspaceKey = getStartupWorkspaceKey();
  if (!workspaceKey || !color || !isValidColorInput(color)) {
    return;
  }

  await saveSurpriseMeStartupSelectionGlobalMemento(workspaceKey, color);
}

function getStartupWorkspaceKey() {
  if (workspace.workspaceFile) {
    return `workspaceFile:${workspace.workspaceFile.toString().toLowerCase()}`;
  }

  if (!workspace.workspaceFolders?.length) {
    return '';
  }

  const sortedWorkspaceFolderUris = workspace.workspaceFolders
    .map(folder => folder.uri.toString().toLowerCase())
    .sort();

  if (sortedWorkspaceFolderUris.length === 1) {
    return `workspaceFolder:${sortedWorkspaceFolderUris[0]}`;
  }

  return `workspaceFolders:${sortedWorkspaceFolderUris.join('|')}`;
}
