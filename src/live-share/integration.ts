/* istanbul ignore file */
import * as vsls from 'vsls';
import * as vscode from 'vscode';

import { applyColor } from '../apply-color';
import { registerLiveShareIntegrationCommands } from './liveshare-commands';
import { State } from '../models';
import { notify } from '../notification';
import { LiveShareSettings } from './enums';
import {
  getLiveShareColor,
  getColorCustomizationConfigFromWorkspace,
  updateWorkspaceConfiguration,
} from '../configuration';

let peacockColorCustomizations: any;

export async function revertLiveShareWorkspaceColors() {
  await updateWorkspaceConfiguration(peacockColorCustomizations);

  peacockColorCustomizations = null;
}

async function setLiveShareSessionWorkspaceColors(isHost: boolean) {
  const colorSettingName = isHost
    ? LiveShareSettings.VSLSShareColor
    : LiveShareSettings.VSLSJoinColor;

  const liveShareColorSetting = getLiveShareColor(colorSettingName);
  if (!liveShareColorSetting) {
    return;
  }

  await applyColor(liveShareColorSetting);
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

    // we need to update `peacockColorCustomizations` only when it is `undefined`
    // to prevent the case of multiple color changes during live share session
    peacockColorCustomizations = await getColorCustomizationConfigFromWorkspace();

    const isHost = e.session.role === vsls.Role.Host;
    return await setLiveShareSessionWorkspaceColors(isHost);
  });
}
