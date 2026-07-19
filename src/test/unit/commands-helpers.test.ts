import { describe, it, expect } from 'vitest';
import {
  resolveFavoriteSelectionAction,
  canSaveFavoriteColor,
  getSideBarDarknessOptions,
} from '../../commands-helpers';

const isValidHexColor = (value: string) => /^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/.test(value);

describe('Commands helpers', () => {
  describe('resolveFavoriteSelectionAction', () => {
    it('applies selected favorite color when valid', () => {
      const result = resolveFavoriteSelectionAction('#007fff', '#21f3aa', isValidHexColor);
      expect(result).toEqual({ action: 'apply', color: '#007fff' });
    });

    it('re-applies starting color when favorite is invalid but starting exists', () => {
      const result = resolveFavoriteSelectionAction('', '#21f3aa', isValidHexColor);
      expect(result).toEqual({ action: 'apply', color: '#21f3aa' });
    });

    it('unapplies when no valid favorite and no starting color', () => {
      const result = resolveFavoriteSelectionAction('', '', isValidHexColor);
      expect(result).toEqual({ action: 'unapply' });
    });
  });

  describe('canSaveFavoriteColor', () => {
    it('returns true when color and name exist', () => {
      expect(canSaveFavoriteColor('#007fff', 'Azure Blue')).toBe(true);
    });

    it('returns false when name is empty', () => {
      expect(canSaveFavoriteColor('#007fff', '')).toBe(false);
    });
  });

  describe('getSideBarDarknessOptions', () => {
    it('includes remove option when sidebar color already exists', () => {
      const options = getSideBarDarknessOptions('#123456');
      expect(options[0]?.label).toBe('Remove Side Bar Color');
      expect(options).toHaveLength(4);
    });

    it('returns only darkness options when sidebar color is not set', () => {
      const options = getSideBarDarknessOptions(undefined);
      expect(options.map(o => o.label)).toEqual(['Dark', 'Darker', 'Darkest']);
    });
  });
});
