import { commands, ExtensionContext } from 'vscode';

import { promptForFavoriteColor } from '../inputs';
import { isValidColorInput, changeColor } from '../color-library';
import {
    remoteContainersColorMementoName,
    remoteSshColorMementoName,
    remoteWslColorMementoName
} from './constants';
import { RemoteCommands } from './enums';
import {
    revertRemoteWorkspaceColors, refreshRemoteColor
} from './integration';
import { extensionContext } from './extension-context';
import { getCurrentColorBeforeAdjustments } from '../configuration';

// Returning the extension context is used by the tests, so that they have a way to access it
async function changeColorForMemento(mementoName: string, remoteName: string): Promise<ExtensionContext> {
    const startingColor = getCurrentColorBeforeAdjustments();
    const input = await promptForFavoriteColor();

    if (isValidColorInput(input)) {
        if (mementoName) {
            await extensionContext.globalState.update(mementoName, input);
        }
    }
    const isRefreshed = await refreshRemoteColor(remoteName);
    if (isRefreshed) {
        return extensionContext;
    }
    if (!startingColor) {
        await revertRemoteWorkspaceColors();
        return extensionContext;
    }
    // if there was a color set prior to color picker,
    //set that color back
    await changeColor(startingColor);
    return extensionContext
}

async function changeRemoteContainersColor(): Promise<ExtensionContext> {
    return changeColorForMemento(remoteContainersColorMementoName, 'dev-container');
}

async function changeRemoteWslColor(): Promise<ExtensionContext> {
    return changeColorForMemento(remoteWslColorMementoName, 'wsl');
}

async function changeRemoteSshColor(): Promise<ExtensionContext> {
    return changeColorForMemento(remoteSshColorMementoName, 'ssh-remote');
}

export function registerRemoteIntegrationCommands() {
    commands.registerCommand(
        RemoteCommands.changeColorOfRemoteWsl,
        changeRemoteWslColor
    );
    commands.registerCommand(
        RemoteCommands.changeColorOfRemoteSsh,
        changeRemoteSshColor
    );
    commands.registerCommand(
        RemoteCommands.changeColorOfRemoteContainers,
        changeRemoteContainersColor
    );
}

export async function resetRemotePreviousColors() {
    await extensionContext.globalState.update(remoteContainersColorMementoName, null);
    await extensionContext.globalState.update(remoteSshColorMementoName, null);
    await extensionContext.globalState.update(remoteWslColorMementoName, null);
}
