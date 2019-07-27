import { peacockMementos, extensionShortName, State } from './models';
import { Logger } from './logging';

export interface IMementoLog {
  name: string;
  type: 'workspaceState' | 'globalState';
  value: any;
}

async function saveGlobalMemento(mementoName: string, value: any) {
  if (mementoName) {
    Logger.info(
      `${extensionShortName}: Saving the globalState ${mementoName} memento with value ${value}`,
    );
    await State.extensionContext.globalState.update(mementoName, value);
  }
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

  return mementos;
}
