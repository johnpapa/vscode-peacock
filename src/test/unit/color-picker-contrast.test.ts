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

  it('defaults to titleBarAffected/foregroundApplied = true, matching the package.json defaults for affectTitleBar/keepForegroundColor', () => {
    const preview = getTitleBarContrastPreview('#ffa500');

    expect(preview.titleBarAffected).toBe(true);
    expect(preview.foregroundApplied).toBe(true);
  });

  it('flags titleBarAffected = false when peacock.affectTitleBar is off, since Peacock will not touch the title bar at all', () => {
    // Code-review follow-up (#755): the preview must not silently imply a
    // guarantee ("can never drift from what Peacock actually applies")
    // that collectTitleBarSettings() doesn't honor for this setting --
    // it only writes titleBar.activeBackground/activeForeground when
    // AffectedSettings.TitleBar is selected.
    const preview = getTitleBarContrastPreview('#ffa500', { titleBarAffected: false });

    expect(preview.titleBarAffected).toBe(false);
    expect(preview.foregroundApplied).toBe(false);
    // The background/foreground pairing itself is still computed (so the
    // swatch stays informative) -- only the "would this actually be
    // applied" flags change.
    expect(preview.foregroundHex).toBe('#15202b');
  });

  it('flags foregroundApplied = false (but titleBarAffected = true) when peacock.keepForegroundColor is on, since only the background would be applied', () => {
    // collectTitleBarSettings() writes titleBar.activeBackground
    // regardless of keepForegroundColor, but only writes
    // titleBar.activeForeground when keepForegroundColor is false.
    const preview = getTitleBarContrastPreview('#ffa500', { keepForegroundColor: true });

    expect(preview.titleBarAffected).toBe(true);
    expect(preview.foregroundApplied).toBe(false);
  });
});
