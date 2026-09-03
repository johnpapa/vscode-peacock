import * as vscode from 'vscode';

import { applyColor, getCurrentColor } from '../apply-color';
import { State } from '../models';

// function remoteExtensionsInstalled(): boolean {
//   let remoteExtensions = [
//     'ms-vscode-remote.remote-containers',
//     'ms-vscode-remote.remote-ssh',
//     'ms-vscode-remote.remote-wsl',
//   ];
//   return !!remoteExtensions.find(each => !!vscode.extensions.getExtension(each));
// }

export async function addRemoteIntegration(context: vscode.ExtensionContext) {
  State.extensionContext = context;

  // const remoteExtensions = remoteExtensionsInstalled();
  // await vscode.commands.executeCommand('setContext', 'peacock:remote', remoteExtensions);

  await applyColor(getCurrentColor() || '');
}
