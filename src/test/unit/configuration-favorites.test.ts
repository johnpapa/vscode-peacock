import { describe, it, expect } from 'vitest';
import { mergeStarterAndExistingFavorites } from '../../configuration/update-configuration';
import { starterSetOfFavorites } from '../../models';
import { parseFavoriteColorValue } from '../../favorite-color';

describe('Favorite configuration helpers', () => {
  it('re-adds removed starter favorites when merging', () => {
    const starterWithoutVue = starterSetOfFavorites.filter(item => item.name !== 'Vue Green');
    const existingWithVue = starterSetOfFavorites;
    const merged = mergeStarterAndExistingFavorites(starterWithoutVue, existingWithVue);
    expect(merged.some(item => item.name === 'Vue Green')).toBe(true);
  });

  it('keeps existing custom favorites when merging', () => {
    const nightBlue = { name: 'Night Blue', value: '#103362' };
    const merged = mergeStarterAndExistingFavorites(starterSetOfFavorites, [
      ...starterSetOfFavorites,
      nightBlue,
    ]);
    expect(
      merged.some(item => item.name === nightBlue.name && item.value === nightBlue.value),
    ).toBe(true);
  });

  it('parses quick pick favorite values', () => {
    expect(parseFavoriteColorValue('Azure Blue -> #007fff')).toBe('#007fff');
  });
});
