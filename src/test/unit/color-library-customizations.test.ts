import { describe, it, expect } from 'vitest';
import { deleteKnownColorCustomizations } from '../../color-library';
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
