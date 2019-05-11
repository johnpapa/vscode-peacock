import { commands, workspace, ConfigurationTarget } from 'vscode';

import { promptForFavoriteColor } from "../inputs";
import { isValidColorInput, changeColor } from "../color-library";
import { VSLS_SHARE_COLOR_MEMENTO_NAME, VSLS_JOIN_COLOR_MEMENTO_NAME } from "./constants";
import { refreshLiveShareSessionColor, revertLiveShareWorkspaceColors } from "./integration";
import { extensionContext } from './extensionContext';
import { getCurrentColorBeforeAdjustments } from '../configuration';
import { start } from 'repl';

enum LiveShareCommands {
  changeColorOfLiveShareHost = 'peacock.changeColorOfLiveShareHost',
  changeColorOfLiveShareGuest = 'peacock.changeColorOfLiveShareGuest'
};

const changeColorOfLiveShareSessionFactory = (isHost: boolean) => {
  return async () => {
    const startingColor = getCurrentColorBeforeAdjustments();
    const input = await promptForFavoriteColor();

    if (isValidColorInput(input)) {
      const settingName = (isHost)
        ? VSLS_SHARE_COLOR_MEMENTO_NAME
        : VSLS_JOIN_COLOR_MEMENTO_NAME;

      await extensionContext.globalState.update(settingName, input);
    }

    if (!startingColor) {
      return await revertLiveShareWorkspaceColors();
    }
    
    const isRefreshed = await refreshLiveShareSessionColor();
    if (!isRefreshed) {
      await changeColor(startingColor);
    }
  };
}

export const changeColorOfLiveShareHostHandler = changeColorOfLiveShareSessionFactory(true);
export const changeColorOfLiveShareGuestHandler = changeColorOfLiveShareSessionFactory(false);

export const registerLiveShareIntegrationCommands = () => {
  commands.registerCommand(
    LiveShareCommands.changeColorOfLiveShareHost,
    changeColorOfLiveShareHostHandler
  );
  commands.registerCommand(
    LiveShareCommands.changeColorOfLiveShareGuest,
    changeColorOfLiveShareGuestHandler
  );

  // commands.registerCommand(Commands.resetColors, resetLiveSharePreviousColors);
}

export async function resetLiveSharePreviousColors() {
  await extensionContext.globalState.update(VSLS_SHARE_COLOR_MEMENTO_NAME, null);
  await extensionContext.globalState.update(VSLS_JOIN_COLOR_MEMENTO_NAME, null);
}