import { commands } from 'vscode';

import { promptForFavoriteColor } from '../inputs';
import { isValidColorInput, changeColor } from '../color-library';
import {
  VSLS_SHARE_COLOR_MEMENTO_NAME,
  VSLS_JOIN_COLOR_MEMENTO_NAME,
  LiveShareCommands
} from './constants';
import {
  refreshLiveShareSessionColor,
  revertLiveShareWorkspaceColors
} from './integration';
import { extensionContext } from './extension-context';
import { getCurrentColorBeforeAdjustments } from '../configuration';

const changeColorOfLiveShareSessionFactory = (isHost: boolean) => {
  return async function changeColorOfLiveShareSession() {
    const startingColor = getCurrentColorBeforeAdjustments();
    const input = await promptForFavoriteColor();

    if (isValidColorInput(input)) {
      const settingName = isHost
        ? VSLS_SHARE_COLOR_MEMENTO_NAME
        : VSLS_JOIN_COLOR_MEMENTO_NAME;

      await extensionContext.globalState.update(settingName, input);
    }

    const isRefreshed = await refreshLiveShareSessionColor(isHost);
    // we are in the session and have updated the color, so return
    if (isRefreshed) {
      return extensionContext;
    }
    // if there is was no color prior to the color picker,
    // revert all the color settings
    if (!startingColor) {
      await revertLiveShareWorkspaceColors();
      return extensionContext;
      // if there was a color set prior to color picker,
      // set that color back
    } else {
      await changeColor(startingColor);
    }

    return extensionContext;
  };
};

export const changeColorOfLiveShareHostHandler = changeColorOfLiveShareSessionFactory(
  true
);
export const changeColorOfLiveShareGuestHandler = changeColorOfLiveShareSessionFactory(
  false
);

export function registerLiveShareIntegrationCommands() {
  commands.registerCommand(
    LiveShareCommands.changeColorOfLiveShareHost,
    changeColorOfLiveShareHostHandler
  );
  commands.registerCommand(
    LiveShareCommands.changeColorOfLiveShareGuest,
    changeColorOfLiveShareGuestHandler
  );
}

export async function resetLiveSharePreviousColors() {
  await extensionContext.globalState.update(
    VSLS_SHARE_COLOR_MEMENTO_NAME,
    null
  );
  await extensionContext.globalState.update(VSLS_JOIN_COLOR_MEMENTO_NAME, null);
}
