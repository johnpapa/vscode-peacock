import { ISettingsIndexer } from './models';

export function sortSettingsIndexer(unordered: ISettingsIndexer) {
  const ordered: ISettingsIndexer = {};
  Object.keys(unordered)
    .sort()
    .forEach(key => (ordered[key] = unordered[key]));
  return ordered;
}
