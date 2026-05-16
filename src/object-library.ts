import { ISettingsIndexer } from './models';

export function sortSettingsIndexer(unordered: ISettingsIndexer) {
  const ordered: ISettingsIndexer = {};
  Object.keys(unordered)
    .sort()
    .forEach(key => (ordered[key] = unordered[key]));
  return ordered;
}

export function settingsIndexersAreEqual(a: ISettingsIndexer, b: ISettingsIndexer) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  return aKeys.every(key => a[key] === b[key]);
}
