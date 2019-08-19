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
} from './commands';
import {
  checkIfPeacockSettingsChanged,
  getSurpriseMeOnStartup,
  writeRecommendedFavoriteColors,
  getEnvironmentAwareColor,
  inspectColor,
  getCurrentColorBeforeAdjustments,
  getFavoriteColors,
  getPeacockColor,
} from './configuration';
import { applyColor, updateColorSetting } from './apply-color';
import { Logger } from './logging';
import { addLiveShareIntegration } from './live-share';
import { addRemoteIntegration } from './remote';
import { saveFavoritesVersionGlobalMemento, getMementos } from './mementos';

const { commands, workspace } = vscode;

export async function activate(context: vscode.ExtensionContext) {
  State.extensionContext = context;
  Logger.info(`${extensionShortName}: Extension "vscode-peacock" is now active!`);
  Logger.info(getMementos(), true, 'Mementos');

  registerCommands();
  await initializeTheStarterSetOfFavorites();

  if (workspace.workspaceFolders) {
    /**
     * Check if we need to migrate.
     * If we do migrate, we write to the settings,
     * so we need to do this after we are already
     * listening for settings changes.
     */
    await migrateFromMementoToSettingsAsNeeded();

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

async function migrateFromMementoToSettingsAsNeeded() {
  /**
   * Version >2.5 of Peacock did not store the peacock color.
   * Version 2.5 of Peacock stored the peacock color in a memento.
   * Version 3 of Peacock stores the color in the settings.
   * If peacock.color does not exist and we find either memento or a deried color,
   * remove the memento, and write the apply the color to the settings.
   *
   * @deprecated since version 3.0.
   * Will be deleted in version 4.0 and once v3.0 users have migrated
   */

  // If peacock.color exists, get out. Nothing to migrate.
  const peacockColorExists = !!getPeacockColor();
  if (peacockColorExists) {
    Logger.info('Migration: Nothing to migrate, peacock.color exists.');
    return;
  }

  // Check for the v2.5 memento
  const peacockColorMementoName = `${extensionShortName}.peacockColor`;
  const peacockColorMemento = State.extensionContext.workspaceState.get<string>(
    peacockColorMementoName,
  );

  let derivedColor = undefined;
  // The v2 memento is gone, so no need to migrate.
  if (peacockColorMemento) {
    Logger.info('Migration: Migrating from peacock memento to peacock.color setting.');
  } else {
    Logger.info('Migration: Detected color customization. Migrating to peacock.color setting.');
    /**
     * If there is no memento, check if there is a
     * color set in the 'old style' w/o the setting peacock.color.
     * If there is, then let's grab it and set it.
     */
    derivedColor = getCurrentColorBeforeAdjustments() || undefined;
  }

  // Remove the v2 memento (it's ok if it doesnt exist)
  await State.extensionContext.workspaceState.update(peacockColorMementoName, undefined);

  // Migrate the color that was in the v2 memento
  // or the derived color to the v3 workspace setting
  const color = peacockColorMemento || derivedColor;

  if (color) {
    // If we found something to migrate then do it
    Logger.info(`Migration: Applying color ${color}.`);
    await updateColorSetting(color);
  }
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
}

export function deactivate() {
  Logger.info(`${extensionShortName}: Extension "vscode-peacock" is now deactive`);
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
  } else {
    let msg = `${extensionShortName}: Already wrote the favorite colors once`;
    Logger.info(msg);
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
