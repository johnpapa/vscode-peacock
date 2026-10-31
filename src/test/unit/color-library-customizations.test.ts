import { describe, it, expect } from 'vitest';
import tinycolor from 'tinycolor2';
import {
  deleteKnownColorCustomizations,
  getActivityBarActiveBackgroundColorHex,
  getBackgroundColorHex,
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
  const bars = [
    '#fe4c37',
    '#832561',
    '#b895dd',
    '#1a6c1f',
    '#3554f5',
    '#ffffff',
    '#15202b',
    '#000000',
  ];

  it.each(bars)('is an opaque hex that differs from the bar background for %s', bar => {
    const active = getActivityBarActiveBackgroundColorHex(bar);
    expect(active).toMatch(/^#[0-9a-f]{6}$/i);
    expect(active).not.toBe(getBackgroundColorHex(bar));
  });

  it.each(bars)("is about as distinct from the bar as VS Code's built-in themes for %s", bar => {
    // The built-in themes use about 1.4:1 between the bar and the active item (#FAFAFD -> #D6D6D6).
    const contrast = tinycolor.readability(getActivityBarActiveBackgroundColorHex(bar), bar);
    expect(contrast).toBeGreaterThanOrEqual(1.4);
    expect(contrast).toBeLessThan(1.5);
  });

  it.each([
    ['#fafafd', '#d6d6d6'],
    ['#2c2c2c', '#444445'],
  ])("is within a few levels of VS Code's built-in theme for %s", (bar, expected) => {
    const actual = tinycolor(getActivityBarActiveBackgroundColorHex(bar)).toRgb();
    const target = tinycolor(expected).toRgb();
    expect(Math.abs(actual.r - target.r)).toBeLessThanOrEqual(4);
    expect(Math.abs(actual.g - target.g)).toBeLessThanOrEqual(4);
    expect(Math.abs(actual.b - target.b)).toBeLessThanOrEqual(4);
  });

  it('lightens very dark bars and darkens the rest', () => {
    const luminanceOf = (bar: string) => tinycolor(bar).getLuminance();
    const activeLuminance = (bar: string) =>
      tinycolor(getActivityBarActiveBackgroundColorHex(bar)).getLuminance();
    expect(activeLuminance('#15202b')).toBeGreaterThan(luminanceOf('#15202b'));
    expect(activeLuminance('#1a6c1f')).toBeLessThan(luminanceOf('#1a6c1f'));
    expect(activeLuminance('#fe4c37')).toBeLessThan(luminanceOf('#fe4c37'));
    expect(activeLuminance('#ffffff')).toBeLessThan(luminanceOf('#ffffff'));
  });
});
