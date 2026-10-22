import { describe, it, expect } from 'vitest';
import tinycolor from 'tinycolor2';
import {
  deleteKnownColorCustomizations,
  getActivityBarActiveBackgroundColorHex,
  getBackgroundColorHex,
  getForegroundColorHex,
} from '../../color-library';
import { ColorSettings } from '../../models';

describe('Color library customizations', () => {
  it('preserves excluded settings while deleting known Peacock-managed keys', () => {
    const input = {
      [ColorSettings.statusBar_background]: '#abcdef',
      [ColorSettings.statusBar_foreground]: '#123123',
      [ColorSettings.titleBar_activeBackground]: '#999999',
      'editor.lineHighlightBackground': '#222222',
    };

    const result = deleteKnownColorCustomizations(input, [ColorSettings.statusBar_background]);

    expect(result[ColorSettings.statusBar_background]).toBe('#abcdef');
    expect(result[ColorSettings.statusBar_foreground]).toBeUndefined();
    expect(result[ColorSettings.titleBar_activeBackground]).toBeUndefined();
    expect(result['editor.lineHighlightBackground']).toBe('#222222');
  });

  it('removes managed settings when there are no exclusions', () => {
    const input = {
      [ColorSettings.statusBar_background]: '#abcdef',
      [ColorSettings.statusBar_foreground]: '#123123',
      [ColorSettings.titleBar_activeBackground]: '#999999',
    };

    const result = deleteKnownColorCustomizations(input);
    expect(result[ColorSettings.statusBar_background]).toBeUndefined();
    expect(result[ColorSettings.statusBar_foreground]).toBeUndefined();
    expect(result[ColorSettings.titleBar_activeBackground]).toBeUndefined();
  });
});

describe('getActivityBarActiveBackgroundColorHex', () => {
  const bars = ['#fe4c37', '#832561', '#b895dd', '#1a6c1f', '#ffffff', '#15202b', '#000000'];

  it.each(bars)('differs from the bar background for %s', bar => {
    expect(getActivityBarActiveBackgroundColorHex(bar)).not.toBe(getBackgroundColorHex(bar));
  });

  it.each(bars)('is opaque and keeps the icon readable for %s', bar => {
    const active = getActivityBarActiveBackgroundColorHex(bar);
    expect(active).toMatch(/^#[0-9a-f]{6}$/i);
    expect(tinycolor.readability(active, getForegroundColorHex(bar))).toBeGreaterThanOrEqual(3);
  });

  it.each([
    ['#191a1b', '#313233'],
    ['#fafafd', '#d6d6d6'],
  ])("is within a few levels of VS Code's built-in 2026 theme for %s", (bar, expected) => {
    const actual = tinycolor(getActivityBarActiveBackgroundColorHex(bar)).toRgb();
    const target = tinycolor(expected).toRgb();
    expect(Math.abs(actual.r - target.r)).toBeLessThanOrEqual(4);
    expect(Math.abs(actual.g - target.g)).toBeLessThanOrEqual(4);
    expect(Math.abs(actual.b - target.b)).toBeLessThanOrEqual(4);
  });

  it('lightens very dark bars and darkens bright ones', () => {
    expect(tinycolor('#15202b').getLuminance()).toBeLessThan(
      tinycolor(getActivityBarActiveBackgroundColorHex('#15202b')).getLuminance(),
    );
    expect(tinycolor('#fe4c37').getLuminance()).toBeGreaterThan(
      tinycolor(getActivityBarActiveBackgroundColorHex('#fe4c37')).getLuminance(),
    );
  });
});
