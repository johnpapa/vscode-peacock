import { peacockMementos, extensionShortName, State } from './models';
import { Logger } from './logging';
import type { CssProfileRegistry } from './css-injection/profiles';

type SurpriseStartupSelections = Record<string, string>;
export type CssStylesheetPaths = Record<string, string>;

export interface ICssWorkspaceOverride {
  color?: string;
  sideBarBackground?: string;
}

export type CssWorkspaceOverrides = Record<string, ICssWorkspaceOverride>;

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

export function getCssInjectionConsentGlobalMemento() {
  const globalState = getGlobalState();
  if (globalState) {
    return globalState.get<boolean>(peacockMementos.cssInjectionConsent, false);
  }
  return fallbackGlobalMementos.get(peacockMementos.cssInjectionConsent) ?? false;
}

export async function saveCssInjectionConsentGlobalMemento(consent: boolean) {
  await saveGlobalMemento(peacockMementos.cssInjectionConsent, consent);
}

export function getCssProfilesGlobalMemento(): CssProfileRegistry {
  const globalState = getGlobalState();
  if (globalState) {
    return globalState.get<CssProfileRegistry>(peacockMementos.cssProfiles, {});
  }
  return fallbackGlobalMementos.get(peacockMementos.cssProfiles) ?? {};
}

export async function saveCssProfilesGlobalMemento(profiles: CssProfileRegistry) {
  await saveGlobalMemento(peacockMementos.cssProfiles, profiles);
}

export function getCssStylesheetPathsGlobalMemento(): CssStylesheetPaths {
  const globalState = getGlobalState();
  if (globalState) {
    return globalState.get<CssStylesheetPaths>(peacockMementos.cssStylesheetPaths, {});
  }
  return fallbackGlobalMementos.get(peacockMementos.cssStylesheetPaths) ?? {};
}

export async function saveCssStylesheetPathGlobalMemento(key: string, cssPath: string) {
  const paths = getCssStylesheetPathsGlobalMemento();
  await saveGlobalMemento(peacockMementos.cssStylesheetPaths, { ...paths, [key]: cssPath });
}

export function getCssWorkspaceOverridesGlobalMemento(): CssWorkspaceOverrides {
  const globalState = getGlobalState();
  if (globalState) {
    return globalState.get<CssWorkspaceOverrides>(peacockMementos.cssWorkspaceOverrides, {});
  }
  return fallbackGlobalMementos.get(peacockMementos.cssWorkspaceOverrides) ?? {};
}

export async function saveCssWorkspaceOverrideGlobalMemento(
  workspaceKey: string,
  override: ICssWorkspaceOverride | undefined,
) {
  const overrides = { ...getCssWorkspaceOverridesGlobalMemento() };
  if (override && (override.color || override.sideBarBackground)) {
    overrides[workspaceKey] = override;
  } else {
    delete overrides[workspaceKey];
  }
  await saveGlobalMemento(peacockMementos.cssWorkspaceOverrides, overrides);
}

export async function clearCssWorkspaceOverridesGlobalMemento() {
  await saveGlobalMemento(peacockMementos.cssWorkspaceOverrides, undefined);
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
    fallbackGlobalMementos.delete(peacockMementos.cssInjectionConsent);
    fallbackGlobalMementos.delete(peacockMementos.cssProfiles);
    fallbackGlobalMementos.delete(peacockMementos.cssStylesheetPaths);
    fallbackGlobalMementos.delete(peacockMementos.cssWorkspaceOverrides);
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
  await ec.globalState.update(peacockMementos.cssInjectionConsent, undefined);
  await ec.globalState.update(peacockMementos.cssProfiles, undefined);
  await ec.globalState.update(peacockMementos.cssStylesheetPaths, undefined);
  await ec.globalState.update(peacockMementos.cssWorkspaceOverrides, undefined);
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
