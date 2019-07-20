import * as vscode from 'vscode';

import { peacockRemoteMementos } from './constants';
import { changeColor } from '../color-library';
import { registerRemoteIntegrationCommands } from './remote-commands';
import { RemoteNames } from './enums';
import { getPeacockColorWorkspaceMemento } from '../mementos';
import { State } from '../models';
import { notify } from '../notification';

export function remoteMementoName(): string | undefined {
  let mementoName = undefined;
  switch (vscode.env.remoteName) {
    case RemoteNames.wsl:
      mementoName = peacockRemoteMementos.remoteWslColor;
      break;
    case RemoteNames.sshRemote:
      mementoName = peacockRemoteMementos.remoteSshColor;
      break;
    case RemoteNames.devContainer:
      mementoName = peacockRemoteMementos.remoteContainersColor;
      break;
  }
  return mementoName;
}

async function setRemoteWorkspaceColors() {
  const remoteColorSetting = getRemoteColor();
  if (!remoteColorSetting) {
    return;
  }

  await changeColor(remoteColorSetting, false);
}

export function getRemoteColor() {
  let mementoName = remoteMementoName();

  if (!mementoName) {
    return;
  }
  return State.extensionContext.globalState.get<string>(mementoName);
}

function remoteExtensionsInstalled(): boolean {
  let remoteExtensions = [
    'ms-vscode-remote.remote-containers',
    'ms-vscode-remote.remote-ssh',
    'ms-vscode-remote.remote-wsl',
  ];
  return !!remoteExtensions.find(each => !!vscode.extensions.getExtension(each));
}

export async function addRemoteIntegration(context: vscode.ExtensionContext) {
  State.extensionContext = context;

  registerRemoteIntegrationCommands();

  const remoteExtensions = remoteExtensionsInstalled();
  await vscode.commands.executeCommand('setContext', 'peacock:remote', remoteExtensions);

  if (!vscode.env.remoteName) {
    revertRemoteWorkspaceColors();
    return;
  }
  setRemoteWorkspaceColors();
}

export async function refreshRemoteColor(remote: string): Promise<boolean> {
  if (vscode.env.remoteName !== remote) {
    notify(
      `The selected color will be applied every time you you are in the '${remote}' context.`,
      true,
    );
    return false;
  }

  await setRemoteWorkspaceColors();
  return true;
}

export async function revertRemoteWorkspaceColors() {
  // reset the color from the memento. Because the recent color may be the remote color
  const peacockColor = getPeacockColorWorkspaceMemento();
  await changeColor(peacockColor);
}
