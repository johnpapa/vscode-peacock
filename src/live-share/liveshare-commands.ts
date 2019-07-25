/* istanbul ignore file */
import { commands } from 'vscode';

import { promptForFavoriteColor } from '../inputs';
import { isValidColorInput, changeColor } from '../color-library';
import { LiveShareCommands, LiveShareSettings } from './enums';
import { refreshLiveShareSessionColor, revertLiveShareWorkspaceColors } from './integration';
import { getCurrentColorBeforeAdjustments, updateLiveShareColor } from '../configuration';
import { State } from '../models';

const changeColorOfLiveShareSessionFactory = (isHost: boolean) => {
  return async function changeColorOfLiveShareSession() {
    const startingColor = getCurrentColorBeforeAdjustments();
    const input = await promptForFavoriteColor();

    if (isValidColorInput(input)) {
      const settingName = isHost
        ? LiveShareSettings.VSLSShareColor
        : LiveShareSettings.VSLSJoinColor;

      await updateLiveShareColor(settingName, input);
    }

    const isRefreshed = await refreshLiveShareSessionColor(isHost);
    // we are in the session and have updated the color, so return
    if (isRefreshed) {
      return State.extensionContext;
    }
    // if there is was no color prior to the color picker,
    // revert all the color settings
    if (!startingColor) {
      await revertLiveShareWorkspaceColors();
      return State.extensionContext;
      // if there was a color set prior to color picker,
      // set that color back
    } else {
      await changeColor(startingColor);
    }

    return State.extensionContext;
  };
};

export const changeColorOfLiveShareHostHandler = changeColorOfLiveShareSessionFactory(true);
export const changeColorOfLiveShareGuestHandler = changeColorOfLiveShareSessionFactory(false);

export function registerLiveShareIntegrationCommands() {
  commands.registerCommand(
    LiveShareCommands.changeColorOfLiveShareHost,
    changeColorOfLiveShareHostHandler,
  );
  commands.registerCommand(
    LiveShareCommands.changeColorOfLiveShareGuest,
    changeColorOfLiveShareGuestHandler,
  );
}

export async function resetLiveSharePreviousColors() {
  await updateLiveShareColor(LiveShareSettings.VSLSShareColor, '');
  await updateLiveShareColor(LiveShareSettings.VSLSJoinColor, '');
}
