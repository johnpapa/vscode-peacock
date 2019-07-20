import { commands, ExtensionContext } from 'vscode';

import { promptForFavoriteColor } from '../inputs';
import { isValidColorInput, changeColor } from '../color-library';
import { peacockRemoteMementos } from './constants';
import { RemoteCommands, RemoteNames } from './enums';
import { revertRemoteWorkspaceColors, refreshRemoteColor } from './integration';
import { getCurrentColorBeforeAdjustments } from '../configuration';
import { saveGlobalMemento } from '../mementos';
import { State } from '../models';

// Returning the extension context is used by the tests, so that they have a way to access it
async function changeColorForMemento(mementoName: string, remoteName: string): Promise<ExtensionContext> {
  const startingColor = getCurrentColorBeforeAdjustments();
  const input = await promptForFavoriteColor();

  if (isValidColorInput(input)) {
    if (mementoName) {
      await saveGlobalMemento(mementoName, input);
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
  return changeColorForMemento(peacockRemoteMementos.remoteContainersColor, RemoteNames.devContainer);
}

async function changeRemoteWslColor(): Promise<ExtensionContext> {
  return changeColorForMemento(peacockRemoteMementos.remoteWslColor, RemoteNames.wsl);
}

async function changeRemoteSshColor(): Promise<ExtensionContext> {
  return changeColorForMemento(peacockRemoteMementos.remoteSshColor, RemoteNames.sshRemote);
}

export function registerRemoteIntegrationCommands() {
  commands.registerCommand(RemoteCommands.changeColorOfRemoteWsl, changeRemoteWslColor);
  commands.registerCommand(RemoteCommands.changeColorOfRemoteSsh, changeRemoteSshColor);
  commands.registerCommand(RemoteCommands.changeColorOfRemoteContainers, changeRemoteContainersColor);
}

export async function resetRemotePreviousColors() {
  await saveGlobalMemento(peacockRemoteMementos.remoteContainersColor, null);
  await saveGlobalMemento(peacockRemoteMementos.remoteSshColor, null);
  await saveGlobalMemento(peacockRemoteMementos.remoteWslColor, null);
}
