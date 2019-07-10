import * as vscode from 'vscode';

import { peacockRemoteMementos } from './constants';
import { changeColor } from '../color-library';
import { registerRemoteIntegrationCommands } from './remote-commands';
import { extensionContext, setExtensionContext } from '../extension-context';
import { setPeacockColorCustomizations } from '../inputs';
import { RemoteNames } from './enums';

let peacockColorCustomizations: any;

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
  const remoteColorSetting = await getRemoteColor();
  if (!remoteColorSetting) {
    return;
  }

  // TODO
  // Before we change to the remote color, grab the peacock color
  // peacockColor = await getCurrentColorBeforeAdjustments();

  await changeColor(remoteColorSetting);
}

async function getRemoteColor() {
  let mementoName = remoteMementoName();

  if (!mementoName) {
    return;
  }
  return await extensionContext.globalState.get<string>(mementoName);
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
  // TODO
  // Before we start the remote or non-remote logic, grab the peacock color
  // peacockColor = await getCurrentColorBeforeAdjustments();

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

export async function revertRemoteWorkspaceColors() {
  // TODO
  // await changeColor(peacockColor);

  await setPeacockColorCustomizations(peacockColorCustomizations);

  peacockColorCustomizations = null;
}
