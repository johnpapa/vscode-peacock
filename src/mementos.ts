import { extensionContext } from './extension-context';
import { isValidColorInput } from './color-library';
import { peacockMementos } from './models';

export async function saveMemento(mementoName: string, value: any) {
  if (mementoName) {
    await extensionContext.globalState.update(mementoName, value);
  }
}

export async function savePeacockColorMemento(color: string) {
  if (isValidColorInput(color)) {
    await saveMemento(peacockMementos.peacockColor, color);
  }
}

export function getPeacockColorMemento() {
  return extensionContext.globalState.get(
    peacockMementos.peacockColor,
    undefined
  );
}

export async function saveFavoritesVersionMemento(version: string) {
  saveMemento(peacockMementos.favoritesVersion, version);
}

export function getFavoritesVersionMemento() {
  return extensionContext.globalState.get(
    peacockMementos.favoritesVersion,
    undefined
  );
}
