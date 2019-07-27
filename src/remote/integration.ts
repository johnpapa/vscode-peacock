import * as vscode from 'vscode';

import { changeColor } from '../color-library';
import { State, StandardSettings } from '../models';
import { notify } from '../notification';
import { getPeacockRemoteColor, getPeacockColor } from '../configuration';

async function setRemoteWorkspaceColors() {
  let setting = StandardSettings.RemoteColor;

  if (!setting) {
    return;
  }
  const remoteColor = getPeacockRemoteColor();
  if (!remoteColor) {
    return;
  }

  await changeColor(remoteColor);
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

  await setRemoteWorkspaceColors();
}

// TODO: - not used
// export async function refreshRemoteColor(remote: string): Promise<boolean> {
//   if (vscode.env.remoteName !== remote) {
//     notify(
//       `The selected color will be applied every time you you are in the '${remote}' context.`,
//       true,
//     );
//     return false;
//   }
//   if (getPeacockColor()) {
//     notify(
//       `The current workspace already uses a peacock color, the selected color will not be applied for this workspace.`,
//       true,
//     );
//     return false;
//   }
//   await setRemoteWorkspaceColors();
//   return true;
// }

export async function revertRemoteWorkspaceColors() {
  const peacockColor = getPeacockColor();
  await changeColor(peacockColor);
}
