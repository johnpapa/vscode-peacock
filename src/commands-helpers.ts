import { getDarkenedColorHex } from './color-library';

type FavoriteAction = 'apply' | 'unapply';

export function resolveFavoriteSelectionAction(
  favoriteColor: string,
  startingColor: string,
  isValidColorInput: (color: string) => boolean,
): { action: FavoriteAction; color?: string } {
  if (isValidColorInput(favoriteColor)) {
    return { action: 'apply', color: favoriteColor };
  }

  if (startingColor) {
    return { action: 'apply', color: startingColor };
  }

  return { action: 'unapply' };
}

export function canSaveFavoriteColor(color: string | undefined, name: string | undefined) {
  return !!color && !!name;
}

export type SideBarDarknessOption = { label: string; factor: number };

export function getSideBarDarknessOptions(existingSideBarColor: string | undefined) {
  const options: SideBarDarknessOption[] = [
    { label: 'Dark', factor: 1 },
    { label: 'Darker', factor: 2 },
    { label: 'Darkest', factor: 3 },
  ];

  if (existingSideBarColor) {
    options.unshift({ label: 'Remove Side Bar Color', factor: 0 });
  }

  return options;
}

export function getSideBarDarkenedColor(baseColor: string, factor: number) {
  let newColor = baseColor;
  for (let i = 0; i < factor; i++) {
    newColor = getDarkenedColorHex(newColor, 10);
  }
  return newColor;
}
