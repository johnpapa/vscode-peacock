import { isValidColorInput } from './color-library';
import { peacockMementos, extensionShortName, State } from './models';
import { Logger } from './logging';
import { peacockVslsMementos } from './live-share/constants';
import { peacockRemoteMementos } from './remote/constants';

export async function saveGlobalMemento(mementoName: string, value: any) {
  if (mementoName) {
    Logger.info(
      `${extensionShortName}: Saving the globalState ${mementoName} memento with value ${value}`
    );
    await State.extensionContext.globalState.update(mementoName, value);
  }
}

async function saveWorkspaceMemento(mementoName: string, value: any) {
  if (mementoName) {
    Logger.info(
      `${extensionShortName}: Saving the workspaceState ${mementoName} memento with value ${value}`
    );
    await State.extensionContext.workspaceState.update(mementoName, value);
  }
}

export async function savePeacockColorMemento(color: string) {
  if (isValidColorInput(color)) {
    await saveWorkspaceMemento(peacockMementos.peacockColor, color);
  }
}

export function getPeacockColorMemento() {
  return State.extensionContext.workspaceState.get<string>(
    peacockMementos.peacockColor,
    ''
  );
}

export async function saveFavoritesVersionMemento(version: string) {
  saveGlobalMemento(peacockMementos.favoritesVersion, version);
}

export function getFavoritesVersionMemento() {
  return State.extensionContext.globalState.get<string>(
    peacockMementos.favoritesVersion,
    ''
  );
}

export async function resetMementos() {
  const ec = State.extensionContext;

  Logger.info(
    `${extensionShortName}: Setting all workspaceState and globalState mementos to undefined`
  );

  // Global
  await ec.globalState.update(peacockMementos.favoritesVersion, undefined);
  await ec.globalState.update(peacockVslsMementos.vslsJoinColor, undefined);
  await ec.globalState.update(peacockVslsMementos.vslsShareColor, undefined);
  await ec.globalState.update(peacockRemoteMementos.remoteContainersColor, undefined);
  await ec.globalState.update(peacockRemoteMementos.remoteSshColor, undefined);
  await ec.globalState.update(peacockRemoteMementos.remoteWslColor, undefined);

  // Workspace
  await ec.workspaceState.update(peacockMementos.peacockColor, undefined);
}
