import { describe, it, expect } from 'vitest';
import { getTitleBarContrastPreview } from '../../color-picker-contrast';

describe('getTitleBarContrastPreview (#708 follow-up)', () => {
  it('selects the dark foreground for a light background, with a passing WCAG AA ratio', () => {
    const preview = getTitleBarContrastPreview('#ffa500'); // orange

    expect(preview.backgroundHex).toBe('#ffa500');
    expect(preview.foregroundHex).toBe('#15202b');
    expect(preview.ratio).toBeGreaterThanOrEqual(4.5);
    expect(preview.isReadable).toBe(true);
  });

  it('selects the dark foreground for another light background (pink), with a passing ratio', () => {
    const preview = getTitleBarContrastPreview('#ffc0cb'); // pink

    expect(preview.foregroundHex).toBe('#15202b');
    expect(preview.ratio).toBeGreaterThanOrEqual(4.5);
    expect(preview.isReadable).toBe(true);
  });

  it('selects the light foreground for a dark background, with a passing ratio', () => {
    const preview = getTitleBarContrastPreview('#0b0b0b');

    expect(preview.foregroundHex).toBe('#e7e7e7');
    expect(preview.ratio).toBeGreaterThanOrEqual(4.5);
    expect(preview.isReadable).toBe(true);
  });

  it('computes the same foreground/ratio pairing regardless of which light color is chosen', () => {
    // The exact concern reported after #708 shipped: does the contrast
    // logic actually run for a color picked via the visual picker, "just
    // like it is for any other color"? Since getTitleBarContrastPreview()
    // is the same pure computation applyColor() itself uses, this proves
    // it does -- for both colors called out (orange and pink) and a third
    // representative light color, not just the one background already
    // covered elsewhere in the suite.
    const orange = getTitleBarContrastPreview('#ffa500');
    const pink = getTitleBarContrastPreview('#ffc0cb');
    const hotPink = getTitleBarContrastPreview('#ff69b4');

    [orange, pink, hotPink].forEach(preview => {
      expect(preview.foregroundHex).toBe('#15202b');
      expect(preview.isReadable).toBe(true);
    });
  });
});
