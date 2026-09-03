/* istanbul ignore file */
import * as vsls from 'vsls';
import * as vscode from 'vscode';

import {
  applyTransientColor,
  captureColorRenderState,
  restoreColorRenderState,
} from '../apply-color';
import { registerLiveShareIntegrationCommands } from './liveshare-commands';
import { State } from '../models';
import { notify } from '../notification';
import { LiveShareSettings } from './enums';
import { getLiveShareColor } from '../configuration';

let previousColorRenderState: unknown;

export async function revertLiveShareWorkspaceColors() {
  await restoreColorRenderState(previousColorRenderState);
  previousColorRenderState = undefined;
}

async function setLiveShareSessionWorkspaceColors(isHost: boolean) {
  const colorSettingName = isHost
    ? LiveShareSettings.VSLSShareColor
    : LiveShareSettings.VSLSJoinColor;

  const liveShareColorSetting = getLiveShareColor(colorSettingName);
  if (!liveShareColorSetting) {
    return;
  }

  await applyTransientColor(liveShareColorSetting);
}

export async function refreshLiveShareSessionColor(isHostRole: boolean): Promise<boolean> {
  const vslsApi = await vsls.getApi();

  // not in Live Share session, no need to update
  if (!vslsApi || !vslsApi.session.id) {
    const verb = isHostRole ? 'host and share' : 'join';

    notify(`The selected color will be applied every time you ${verb} a Live Share session.`, true);

    return false;
  }

  const isHost = vslsApi.session.role === vsls.Role.Host;
  await setLiveShareSessionWorkspaceColors(isHost);
  return true;
}

export async function addLiveShareIntegration(context: vscode.ExtensionContext) {
  State.extensionContext = context;

  registerLiveShareIntegrationCommands();

  const vslsApi = await vsls.getApi();
  await vscode.commands.executeCommand('setContext', 'peacock:liveshare', !!vslsApi);

  if (!vslsApi) {
    return;
  }

  vslsApi!.onDidChangeSession(async e => {
    // If there isn't a session ID, then that
    // means the session has been ended.
    if (!e.session.id) {
      return await revertLiveShareWorkspaceColors();
    }

    // Capture once so multiple changes in one session still restore the color
    // from before the session.
    if (previousColorRenderState === undefined) {
      previousColorRenderState = await captureColorRenderState();
    }

    const isHost = e.session.role === vsls.Role.Host;
    return await setLiveShareSessionWorkspaceColors(isHost);
  });
}
