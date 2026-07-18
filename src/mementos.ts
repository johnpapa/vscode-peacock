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

export async function saveSurpriseMeFavoritesOrderGlobalMemento(index: number, key: string) {
  await saveGlobalMemento(peacockMementos.surpriseMeFavoritesOrderIndex, index);
  await saveGlobalMemento(peacockMementos.surpriseMeFavoritesOrderKey, key);
}

export function getFavoritesVersionGlobalMemento() {
  return State.extensionContext.globalState.get<string>(peacockMementos.favoritesVersion, '');
}

export function getSurpriseMeFavoritesOrderIndexGlobalMemento() {
  return State.extensionContext.globalState.get<number>(
    peacockMementos.surpriseMeFavoritesOrderIndex,
    -1,
  );
}

export function getSurpriseMeFavoritesOrderKeyGlobalMemento() {
  return State.extensionContext.globalState.get<string>(
    peacockMementos.surpriseMeFavoritesOrderKey,
    '',
  );
}

export async function resetFavoritesVersionMemento() {
  const ec = State.extensionContext;

  Logger.info(
    `${extensionShortName}: Setting all workspaceState and globalState mementos to undefined`,
  );

  // Global
  await ec.globalState.update(peacockMementos.favoritesVersion, undefined);
  await ec.globalState.update(peacockMementos.surpriseMeFavoritesOrderIndex, undefined);
  await ec.globalState.update(peacockMementos.surpriseMeFavoritesOrderKey, undefined);
}

export function getMementos() {
  const ec = State.extensionContext;
  const mementos: IMementoLog[] = [];

  // Globals
  mementos.push({
    name: peacockMementos.favoritesVersion,
    type: 'globalState',
    value: ec.globalState.get(peacockMementos.favoritesVersion),
  });
  mementos.push({
    name: peacockMementos.surpriseMeFavoritesOrderIndex,
    type: 'globalState',
    value: ec.globalState.get(peacockMementos.surpriseMeFavoritesOrderIndex),
  });
  mementos.push({
    name: peacockMementos.surpriseMeFavoritesOrderKey,
    type: 'globalState',
    value: ec.globalState.get(peacockMementos.surpriseMeFavoritesOrderKey),
  });

  return mementos;
}
