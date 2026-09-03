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
    if (value === undefined) {
      fallbackGlobalMementos.delete(mementoName);
    } else {
      fallbackGlobalMementos.set(mementoName, value);
    }
  }
}

function getGlobalMemento<T>(mementoName: string, fallback: T): T {
  return (
    getGlobalState()?.get<T>(mementoName, fallback) ??
    fallbackGlobalMementos.get(mementoName) ??
    fallback
  );
}

export function getCssInjectionConsentGlobalMemento() {
  return getGlobalMemento(peacockMementos.cssInjectionConsent, false);
}

export async function saveCssInjectionConsentGlobalMemento(consent: boolean) {
  await saveGlobalMemento(peacockMementos.cssInjectionConsent, consent);
}

export function getCssProfilesGlobalMemento(): CssProfileRegistry {
  return getGlobalMemento(peacockMementos.cssProfiles, {});
}

export async function saveCssProfilesGlobalMemento(profiles: CssProfileRegistry) {
  await saveGlobalMemento(peacockMementos.cssProfiles, profiles);
}

export function getCssStylesheetPathsGlobalMemento(): CssStylesheetPaths {
  return getGlobalMemento(peacockMementos.cssStylesheetPaths, {});
}

export async function saveCssStylesheetPathGlobalMemento(key: string, cssPath: string) {
  const paths = getCssStylesheetPathsGlobalMemento();
  await saveGlobalMemento(peacockMementos.cssStylesheetPaths, { ...paths, [key]: cssPath });
}

export function getCssWorkspaceOverridesGlobalMemento(): CssWorkspaceOverrides {
  return getGlobalMemento(peacockMementos.cssWorkspaceOverrides, {});
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
  return getGlobalMemento(peacockMementos.favoritesVersion, '');
}

export function getSurpriseMeFavoritesOrderIndexGlobalMemento() {
  return getGlobalMemento(peacockMementos.surpriseMeFavoritesOrderIndex, -1);
}

export function getSurpriseMeFavoritesOrderKeyGlobalMemento() {
  return getGlobalMemento(peacockMementos.surpriseMeFavoritesOrderKey, '');
}

export function getSurpriseMeStartupSelectionsGlobalMemento(): SurpriseStartupSelections {
  return getGlobalMemento(peacockMementos.surpriseMeStartupSelections, {});
}

export async function resetFavoritesVersionMemento() {
  const names = [
    peacockMementos.favoritesVersion,
    peacockMementos.surpriseMeFavoritesOrderIndex,
    peacockMementos.surpriseMeFavoritesOrderKey,
    peacockMementos.surpriseMeStartupSelections,
  ];
  const globalState = getGlobalState();
  if (!globalState) {
    names.forEach(name => fallbackGlobalMementos.delete(name));
    Logger.info(
      `${extensionShortName}: Skipping memento reset because extension context is not initialized yet`,
    );
    return;
  }

  Logger.info(
    `${extensionShortName}: Setting all workspaceState and globalState mementos to undefined`,
  );

  await Promise.all(names.map(name => globalState.update(name, undefined)));
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
