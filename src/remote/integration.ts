import * as vscode from 'vscode';

import { changeColor } from '../color-library';
import { RemoteNames, RemoteSettings } from './enums';
import { getPeacockColorWorkspaceMemento } from '../mementos';
import { State } from '../models';
import { notify } from '../notification';
import { getRemoteColor } from '../configuration';

function getRemoteSettingName() {
  let setting = undefined;
  switch (vscode.env.remoteName) {
    case RemoteNames.wsl:
      setting = RemoteSettings.RemoteWslColor;
      break;
    case RemoteNames.sshRemote:
      setting = RemoteSettings.RemoteSshColor;
      break;
    case RemoteNames.devContainer:
      setting = RemoteSettings.RemoteContainersColor;
      break;
  }
  return setting;
}

async function setRemoteWorkspaceColors() {
  let setting = getRemoteSettingName();

  if (!setting) {
    return;
  }
  const remoteColor = getRemoteColor(setting);
  if (!remoteColor) {
    return;
  }

  await changeColor(remoteColor, false);
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

  const remoteExtensions = remoteExtensionsInstalled();
  await vscode.commands.executeCommand('setContext', 'peacock:remote', remoteExtensions);

  if (!vscode.env.remoteName) {
    revertRemoteWorkspaceColors();
    return;
  }
  // don't overwrite an already defined custom color
  if (!getPeacockColorWorkspaceMemento()) {
    setRemoteWorkspaceColors();
  }
}

export async function refreshRemoteColor(remote: string): Promise<boolean> {
  if (vscode.env.remoteName !== remote) {
    notify(
      `The selected color will be applied every time you you are in the '${remote}' context.`,
      true,
    );
    return false;
  }
  if (getPeacockColorWorkspaceMemento()) {
    notify(
      `The current workspace already uses a peacock color, the selected color will not be applied for this workspace.`,
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
