import { describe, it, expect } from 'vitest';
import { getDarkenedColorHex, getLightenedColorHex } from '../../color-library';
import { peacockGreen } from '../../models';

describe('Darken/Lighten color helpers', () => {
  it('darkens a color by the given percentage', () => {
    expect(getDarkenedColorHex(peacockGreen, 10)).toBe('#359268');
  });

  it('lightens a color by the given percentage', () => {
    expect(getLightenedColorHex(peacockGreen, 10)).toBe('#65c89b');
  });

  it('defaults to a 10% adjustment when no amount is given', () => {
    expect(getDarkenedColorHex(peacockGreen)).toBe(getDarkenedColorHex(peacockGreen, 10));
    expect(getLightenedColorHex(peacockGreen)).toBe(getLightenedColorHex(peacockGreen, 10));
  });
});
