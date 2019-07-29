import * as vscode from 'vscode';

import { applyColor } from '../apply-color';
import { State } from '../models';
import { getPeacockRemoteColor, getPeacockColor } from '../configuration';

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

  // TODO: revisit this ... should we change colors for remote, non remote, or never, or both?
  if (vscode.env.remoteName) {
    const remoteColor = getPeacockRemoteColor();
    await applyColor(remoteColor);
  } else {
    const peacockColor = getPeacockColor();
    await applyColor(peacockColor);
  }
}
