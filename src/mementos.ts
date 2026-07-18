import { peacockMementos, extensionShortName, State } from './models';
import { Logger } from './logging';

type SurpriseStartupSelections = Record<string, string>;

export interface IMementoLog {
  name: string;
  type: 'workspaceState' | 'globalState';
  value: any;
}

const fallbackGlobalMementos = new Map<string, any>();

function getGlobalState() {
  return State.extensionContext?.globalState;
}

async function saveGlobalMemento(mementoName: string, value: any) {
  if (mementoName) {
    Logger.info(
      `${extensionShortName}: Saving the globalState ${mementoName} memento with value ${value}`,
    );
    const globalState = getGlobalState();
    if (globalState) {
      await globalState.update(mementoName, value);
      return;
    }
    fallbackGlobalMementos.set(mementoName, value);
  }
}

export async function saveFavoritesVersionGlobalMemento(version: string) {
  saveGlobalMemento(peacockMementos.favoritesVersion, version);
}

export async function saveSurpriseMeFavoritesOrderGlobalMemento(index: number, key: string) {
  await saveGlobalMemento(peacockMementos.surpriseMeFavoritesOrderIndex, index);
  await saveGlobalMemento(peacockMementos.surpriseMeFavoritesOrderKey, key);
}

export async function saveSurpriseMeStartupSelectionGlobalMemento(
  workspaceKey: string,
  color: string,
) {
  if (!workspaceKey || !color) {
    return;
  }

  const selections = getSurpriseMeStartupSelectionsGlobalMemento();
  await saveGlobalMemento(peacockMementos.surpriseMeStartupSelections, {
    ...selections,
    [workspaceKey]: color.toLowerCase(),
  });
}

export function getFavoritesVersionGlobalMemento() {
  const globalState = getGlobalState();
  if (globalState) {
    return globalState.get<string>(peacockMementos.favoritesVersion, '');
  }
  return fallbackGlobalMementos.get(peacockMementos.favoritesVersion) ?? '';
}

export function getSurpriseMeFavoritesOrderIndexGlobalMemento() {
  const globalState = getGlobalState();
  if (globalState) {
    return globalState.get<number>(peacockMementos.surpriseMeFavoritesOrderIndex, -1);
  }
  return fallbackGlobalMementos.get(peacockMementos.surpriseMeFavoritesOrderIndex) ?? -1;
}

export function getSurpriseMeFavoritesOrderKeyGlobalMemento() {
  const globalState = getGlobalState();
  if (globalState) {
    return globalState.get<string>(peacockMementos.surpriseMeFavoritesOrderKey, '');
  }
  return fallbackGlobalMementos.get(peacockMementos.surpriseMeFavoritesOrderKey) ?? '';
}

export function getSurpriseMeStartupSelectionsGlobalMemento(): SurpriseStartupSelections {
  const globalState = getGlobalState();
  if (globalState) {
    return globalState.get<SurpriseStartupSelections>(
      peacockMementos.surpriseMeStartupSelections,
      {},
    );
  }
  return fallbackGlobalMementos.get(peacockMementos.surpriseMeStartupSelections) ?? {};
}

export async function resetFavoritesVersionMemento() {
  const ec = State.extensionContext;
  if (!ec?.globalState) {
    fallbackGlobalMementos.delete(peacockMementos.favoritesVersion);
    fallbackGlobalMementos.delete(peacockMementos.surpriseMeFavoritesOrderIndex);
    fallbackGlobalMementos.delete(peacockMementos.surpriseMeFavoritesOrderKey);
    fallbackGlobalMementos.delete(peacockMementos.surpriseMeStartupSelections);
    Logger.info(
      `${extensionShortName}: Skipping memento reset because extension context is not initialized yet`,
    );
    return;
  }

  Logger.info(
    `${extensionShortName}: Setting all workspaceState and globalState mementos to undefined`,
  );

  // Global
  await ec.globalState.update(peacockMementos.favoritesVersion, undefined);
  await ec.globalState.update(peacockMementos.surpriseMeFavoritesOrderIndex, undefined);
  await ec.globalState.update(peacockMementos.surpriseMeFavoritesOrderKey, undefined);
  await ec.globalState.update(peacockMementos.surpriseMeStartupSelections, undefined);
}

export function getMementos() {
  const mementos: IMementoLog[] = [];

  // Globals
  mementos.push({
    name: peacockMementos.favoritesVersion,
    type: 'globalState',
    value: getFavoritesVersionGlobalMemento(),
  });
  mementos.push({
    name: peacockMementos.surpriseMeFavoritesOrderIndex,
    type: 'globalState',
    value: getSurpriseMeFavoritesOrderIndexGlobalMemento(),
  });
  mementos.push({
    name: peacockMementos.surpriseMeFavoritesOrderKey,
    type: 'globalState',
    value: getSurpriseMeFavoritesOrderKeyGlobalMemento(),
  });
  mementos.push({
    name: peacockMementos.surpriseMeStartupSelections,
    type: 'globalState',
    value: getSurpriseMeStartupSelectionsGlobalMemento(),
  });

  return mementos;
}
