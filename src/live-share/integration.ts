import * as vsls from 'vsls';
import * as vscode from 'vscode';

import {
  VSLS_SHARE_COLOR_MEMENTO_NAME,
  VSLS_JOIN_COLOR_MEMENTO_NAME,
  VSCODE_WORKSPACE_COLORS_SETTING_NAME
} from './constants';
import { changeColor } from '../color-library';
import { registerLiveShareIntegrationCommands } from './liveshare-commands';
import { extensionContext, setExtensionContext } from './extension-context';

let peacockColorCustomizations: any;
export async function revertLiveShareWorkspaceColors() {
  await vscode.workspace
    .getConfiguration()
    .update(
      VSCODE_WORKSPACE_COLORS_SETTING_NAME,
      peacockColorCustomizations,
      vscode.ConfigurationTarget.Workspace
    );

  peacockColorCustomizations = null;
}

async function setLiveShareSessionWorkspaceColors(isHost: boolean) {
  const colorSettingName = isHost
    ? VSLS_SHARE_COLOR_MEMENTO_NAME
    : VSLS_JOIN_COLOR_MEMENTO_NAME;

  const liveShareColorSetting = await extensionContext.globalState.get<string>(
    colorSettingName
  );
  if (!liveShareColorSetting) {
    return;
  }

  await changeColor(liveShareColorSetting);
}

export async function refreshLiveShareSessionColor(
  isHostRole: boolean
): Promise<boolean> {
  const vslsApi = await vsls.getApi();

  // not in Live Share session, no need to update
  if (!vslsApi || !vslsApi.session.id) {
    const verb = isHostRole ? 'share' : 'join';

    vscode.window.showInformationMessage(
      `The selected color will be applied every time you ${verb} a Live Share session.`
    );

    return false;
  }

  const isHost = vslsApi.session.role === vsls.Role.Host;
  await setLiveShareSessionWorkspaceColors(isHost);
  return true;
}

export async function addLiveShareIntegration(
  context: vscode.ExtensionContext
) {
  setExtensionContext(context);

  registerLiveShareIntegrationCommands();

  const vslsApi = await vsls.getApi();
  await vscode.commands.executeCommand(
    'setContext',
    'peacock:liveshare',
    !!vslsApi
  );

  if (!vslsApi) {
    return;
  }

  vslsApi!.onDidChangeSession(async function onLiveShareSessionCHange(e) {
    // If there isn't a session ID, then that
    // means the session has been ended.
    if (!e.session.id) {
      return await revertLiveShareWorkspaceColors();
    }

    // we need to update `peacockColorCustomizations` only when it is `undefined`
    // to prevent the case of multiple color changes during live share session
    peacockColorCustomizations = await vscode.workspace
      .getConfiguration()
      .get(VSCODE_WORKSPACE_COLORS_SETTING_NAME);

    const isHost = e.session.role === vsls.Role.Host;
    return await setLiveShareSessionWorkspaceColors(isHost);
  });
}
