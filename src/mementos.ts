import { extensionContext } from './extension-context';
import { isValidColorInput } from './color-library';
import { peacockMementos, extensionShortName } from './models';
import { Logger } from './logging';

export async function saveMemento(mementoName: string, value: any) {
  if (mementoName) {
    Logger.info(
      `${extensionShortName}: Saving the ${mementoName} memento with value ${value}`
    );
    await extensionContext.globalState.update(mementoName, value);
  }
}

export async function savePeacockColorMemento(color: string) {
  if (isValidColorInput(color)) {
    await saveMemento(peacockMementos.peacockColor, color);
  }
}

export function getPeacockColorMemento() {
  return extensionContext.workspaceState.get<string>(
    peacockMementos.peacockColor,
    ''
  );
}

export async function saveFavoritesVersionMemento(version: string) {
  saveMemento(peacockMementos.favoritesVersion, version);
}

export function getFavoritesVersionMemento() {
  return extensionContext.globalState.get<string>(
    peacockMementos.favoritesVersion,
    ''
  );
}
