import { describe, it, expect } from 'vitest';
import { deleteKnownColorCustomizations } from '../../color-library';
import { ColorSettings } from '../../models';

const managedSettings = Object.values(ColorSettings);

describe('Affected element managed settings cleanup', () => {
  managedSettings.forEach(setting => {
    it(`removes managed setting ${setting}`, () => {
      const input: Record<string, string> = {
        [setting]: '#123456',
        'editor.lineHighlightBackground': '#abcdef',
      };
      const result = deleteKnownColorCustomizations(input, []);
      expect(result[setting]).toBeUndefined();
      expect(result['editor.lineHighlightBackground']).toBe('#abcdef');
    });
  });

  managedSettings.forEach(setting => {
    it(`preserves excluded managed setting ${setting}`, () => {
      const input: Record<string, string> = {
        [setting]: '#123456',
        'editor.lineHighlightBackground': '#abcdef',
      };
      const result = deleteKnownColorCustomizations(input, [setting]);
      expect(result[setting]).toBe('#123456');
      expect(result['editor.lineHighlightBackground']).toBe('#abcdef');
    });
  });
});
