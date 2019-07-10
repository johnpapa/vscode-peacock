import * as vscode from 'vscode';

import {
  remoteContainersColorMementoName,
  remoteSshColorMementoName,
  remoteWslColorMementoName
} from './constants';
import { changeColor } from '../color-library';
import { registerRemoteIntegrationCommands } from './remote-commands';
import { extensionContext, setExtensionContext } from './extension-context';
import { setPeacockColorCustomizations } from '../inputs';

let peacockColorCustomizations: any;

export async function revertRemoteWorkspaceColors() {
  await setPeacockColorCustomizations(peacockColorCustomizations);

  peacockColorCustomizations = null;
}

export function remoteMementoName(): string | undefined {
  let mementoName = undefined;
  switch (vscode.env.remoteName) {
    case 'wsl':
      mementoName = remoteWslColorMementoName;
      break;
    case 'ssh-remote':
      mementoName = remoteSshColorMementoName;
      break;
    case 'dev-container':
      mementoName = remoteContainersColorMementoName;
      break;
  }
  return mementoName;
}

async function setRemoteWorkspaceColors() {
  let mementoName = remoteMementoName();

  if (!mementoName) {
    return;
  }
  const remoteColorSetting = await extensionContext.globalState.get<string>(
    mementoName
  );
  if (!remoteColorSetting) {
    return;
  }
  await changeColor(remoteColorSetting);
}

function remoteExtensionsInstalled(): boolean {
  let remoteExtensions = [
    'ms-vscode-remote.remote-containers',
    'ms-vscode-remote.remote-ssh',
    'ms-vscode-remote.remote-wsl'
  ];
  return !!remoteExtensions.find(
    each => !!vscode.extensions.getExtension(each)
  );
}

export async function addRemoteIntegration(context: vscode.ExtensionContext) {
  setExtensionContext(context);

  registerRemoteIntegrationCommands();

  const remoteExtensions = remoteExtensionsInstalled();
  await vscode.commands.executeCommand(
    'setContext',
    'peacock:remote',
    remoteExtensions
  );

  if (!vscode.env.remoteName) {
    revertRemoteWorkspaceColors();
    return;
  }
  setRemoteWorkspaceColors();
}

export async function refreshRemoteColor(remote: string): Promise<boolean> {
  if (vscode.env.remoteName !== remote) {
    vscode.window.showInformationMessage(
      `The selected color will be applied every time you you are in the '${remote}' context.`
    );
    return false;
  }
  await setRemoteWorkspaceColors();
  return true;
}
