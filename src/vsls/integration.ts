import * as vsls from 'vsls';
import * as vscode from 'vscode';

import { VSLS_SHARE_COLOR_MEMENTO_NAME, VSLS_JOIN_COLOR_MEMENTO_NAME } from './constants';
import { changeColor } from '../color-library';
import { registerLiveShareIntegrationCommands } from './liveshare-commands';
import { extensionContext, setExtensionContext } from './extensionContext';

let priorWorkspaceColorCustomizations: any;
export const revertLiveShareWorkspaceColors = async () => {
    await vscode.workspace
        .getConfiguration()
        .update(
            'workbench.colorCustomizations',
            priorWorkspaceColorCustomizations,
            vscode.ConfigurationTarget.Workspace
        );

    priorWorkspaceColorCustomizations = null;
};

const setLiveShareSessionWorkspaceColors = async (isHost: boolean) => {
    const colorSettingName = (isHost)
        ? VSLS_SHARE_COLOR_MEMENTO_NAME
        : VSLS_JOIN_COLOR_MEMENTO_NAME;

    const liveShareColorSetting = await extensionContext.globalState.get<string>(colorSettingName);

    if (!liveShareColorSetting) {
        return;
    }

    // const vslsApi = (await vsls.getApi())!;
    // const isLiveShareSession = (vslsApi && vslsApi.session.id);

    // we need to update `priorWorkspaceColorCustomizations` only when it is `undefined`
    // to prevent the case of multiple color changes during live share session
    if (!priorWorkspaceColorCustomizations) {
        priorWorkspaceColorCustomizations = await vscode.workspace
            .getConfiguration()
            .get('workbench.colorCustomizations');
    }

    await changeColor(liveShareColorSetting);
}

export const refreshLiveShareSessionColor = async (): Promise<boolean> => {
    const vslsApi = (await vsls.getApi())!;

    if (!vslsApi || !vslsApi.session.id) {
        return false;
    }
    
    const isHost = (vslsApi.session.role === vsls.Role.Host);
    await setLiveShareSessionWorkspaceColors(isHost);
    return true;
}

export const addVSLSIntegration = async (context: vscode.ExtensionContext) => {
    setExtensionContext(context);

    registerLiveShareIntegrationCommands();
    
    const vslsApi = (await vsls.getApi())!;
    await vscode.commands.executeCommand('setContext', 'peacock:liveshare', !!vslsApi);

    if (!vslsApi) {
        return;
    }

    vslsApi!.onDidChangeSession(async (e) => {
        // If there isn't a session ID, then that
        // means the session has been ended.
        if (!e.session.id) {
          return await revertLiveShareWorkspaceColors();
        }
    
        const isHost = (e.session.role === vsls.Role.Host);
        return await setLiveShareSessionWorkspaceColors(isHost);
    });
}
