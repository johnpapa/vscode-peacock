import { isValidColorInput } from './color-library';
import { peacockMementos, extensionShortName, State } from './models';
import { Logger } from './logging';
import { peacockVslsMementos } from './live-share/constants';

export interface IMementoLog {
  name: string;
  type: 'workspaceState' | 'globalState';
  value: any;
}

export async function saveGlobalMemento(mementoName: string, value: any) {
  if (mementoName) {
    Logger.info(
      `${extensionShortName}: Saving the globalState ${mementoName} memento with value ${value}`,
    );
    await State.extensionContext.globalState.update(mementoName, value);
  }
}

async function saveWorkspaceMemento(mementoName: string, value: any) {
  if (mementoName) {
    Logger.info(
      `${extensionShortName}: Saving the workspaceState ${mementoName} memento with value ${value}`,
    );
    await State.extensionContext.workspaceState.update(mementoName, value);
  }
}

export async function savePeacockColorWorkspaceMemento(color: string) {
  if (isValidColorInput(color)) {
    await saveWorkspaceMemento(peacockMementos.peacockColor, color);
  }
}

export function getPeacockColorWorkspaceMemento() {
  return State.extensionContext.workspaceState.get<string>(peacockMementos.peacockColor, '');
}

export async function saveFavoritesVersionGlobalMemento(version: string) {
  saveGlobalMemento(peacockMementos.favoritesVersion, version);
}

export function getFavoritesVersionGlobalMemento() {
  return State.extensionContext.globalState.get<string>(peacockMementos.favoritesVersion, '');
}

export async function resetMementos() {
  const ec = State.extensionContext;

  Logger.info(
    `${extensionShortName}: Setting all workspaceState and globalState mementos to undefined`,
  );

  // Global
  await ec.globalState.update(peacockMementos.favoritesVersion, undefined);

  await ec.globalState.update(peacockVslsMementos.vslsJoinColor, undefined);
  await ec.globalState.update(peacockVslsMementos.vslsShareColor, undefined);

  // Workspace
  await ec.workspaceState.update(peacockMementos.peacockColor, undefined);
}

export function getMementos() {
  const ec = State.extensionContext;
  let mementos: IMementoLog[] = [];

  // Globals
  mementos.push({
    name: peacockMementos.favoritesVersion,
    type: 'globalState',
    value: ec.globalState.get(peacockMementos.favoritesVersion),
  });
  mementos.push({
    name: peacockVslsMementos.vslsJoinColor,
    type: 'globalState',
    value: ec.globalState.get(peacockVslsMementos.vslsJoinColor),
  });
  mementos.push({
    name: peacockVslsMementos.vslsShareColor,
    type: 'globalState',
    value: ec.globalState.get(peacockVslsMementos.vslsShareColor),
  });

  // Workspace
  mementos.push({
    name: peacockMementos.peacockColor,
    type: 'workspaceState',
    value: ec.workspaceState.get(peacockMementos.peacockColor),
  });

  return mementos;
}
