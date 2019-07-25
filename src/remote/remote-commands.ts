import { commands, ExtensionContext } from 'vscode';

import { promptForFavoriteColor } from '../inputs';
import { isValidColorInput, changeColor } from '../color-library';
import { RemoteCommands, RemoteNames, RemoteSettings } from './enums';
import { revertRemoteWorkspaceColors, refreshRemoteColor } from './integration';
import { getCurrentColorBeforeAdjustments, updateRemoteColor } from '../configuration';
import { State } from '../models';

// Returning the extension context is used by the tests, so that they have a way to access it
async function changeColorForRemote(
  settingName: RemoteSettings,
  remoteName: string,
): Promise<ExtensionContext> {
  const startingColor = getCurrentColorBeforeAdjustments();
  const input = await promptForFavoriteColor();

  if (isValidColorInput(input)) {
    if (settingName) {
      await updateRemoteColor(settingName, input);
    }
  }
  const isRefreshed = await refreshRemoteColor(remoteName);
  if (isRefreshed) {
    return State.extensionContext;
  }
  if (!startingColor) {
    await revertRemoteWorkspaceColors();
    return State.extensionContext;
  }
  // if there was a color set prior to color picker,
  // set that color back
  await changeColor(startingColor);
  return State.extensionContext;
}

async function changeRemoteContainersColor(): Promise<ExtensionContext> {
  return changeColorForRemote(RemoteSettings.RemoteContainersColor, RemoteNames.devContainer);
}

async function changeRemoteWslColor(): Promise<ExtensionContext> {
  return changeColorForRemote(RemoteSettings.RemoteWslColor, RemoteNames.wsl);
}

async function changeRemoteSshColor(): Promise<ExtensionContext> {
  return changeColorForRemote(RemoteSettings.RemoteSshColor, RemoteNames.sshRemote);
}

export function registerRemoteIntegrationCommands() {
  commands.registerCommand(RemoteCommands.changeColorOfRemoteWsl, changeRemoteWslColor);
  commands.registerCommand(RemoteCommands.changeColorOfRemoteSsh, changeRemoteSshColor);
  commands.registerCommand(
    RemoteCommands.changeColorOfRemoteContainers,
    changeRemoteContainersColor,
  );
}

export async function resetRemotePreviousColors() {
  await updateRemoteColor(RemoteSettings.RemoteContainersColor, '');
  await updateRemoteColor(RemoteSettings.RemoteSshColor, '');
  await updateRemoteColor(RemoteSettings.RemoteWslColor, '');
}
