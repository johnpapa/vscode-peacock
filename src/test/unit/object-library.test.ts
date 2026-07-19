import { describe, it, expect } from 'vitest';
import { sortSettingsIndexer, settingsIndexersAreEqual } from '../../object-library';

describe('Object Library', () => {
  describe('sortSettingsIndexer', () => {
    it('returns keys in alphabetical order', () => {
      const unordered = { zebra: '#000', apple: '#111', mango: '#222' };
      const ordered = sortSettingsIndexer(unordered);
      const keys = Object.keys(ordered);
      expect(keys).toEqual(['apple', 'mango', 'zebra']);
    });

    it('preserves values after sorting', () => {
      const unordered = { b: '#222', a: '#111' };
      const ordered = sortSettingsIndexer(unordered);
      expect(ordered['a']).toBe('#111');
      expect(ordered['b']).toBe('#222');
    });

    it('handles empty object', () => {
      const ordered = sortSettingsIndexer({});
      expect(ordered).toEqual({});
    });

    it('handles single key', () => {
      const ordered = sortSettingsIndexer({ only: '#fff' });
      expect(Object.keys(ordered)).toEqual(['only']);
    });
  });

  describe('settingsIndexersAreEqual', () => {
    it('returns true for identical objects', () => {
      const a = { 'titleBar.activeBackground': '#ff0000', 'statusBar.background': '#00ff00' };
      const b = { 'titleBar.activeBackground': '#ff0000', 'statusBar.background': '#00ff00' };
      expect(settingsIndexersAreEqual(a, b)).toBe(true);
    });

    it('returns true for two empty objects', () => {
      expect(settingsIndexersAreEqual({}, {})).toBe(true);
    });

    it('returns false when key counts differ', () => {
      const a = { 'titleBar.activeBackground': '#ff0000' };
      const b = { 'titleBar.activeBackground': '#ff0000', 'statusBar.background': '#00ff00' };
      expect(settingsIndexersAreEqual(a, b)).toBe(false);
    });

    it('returns false when a is empty and b has keys', () => {
      expect(settingsIndexersAreEqual({}, { key: 'value' })).toBe(false);
    });

    it('returns false when values differ for same keys', () => {
      const a = { 'titleBar.activeBackground': '#ff0000' };
      const b = { 'titleBar.activeBackground': '#00ff00' };
      expect(settingsIndexersAreEqual(a, b)).toBe(false);
    });

    it('returns false when keys differ but count is same', () => {
      const a = { 'titleBar.activeBackground': '#ff0000' };
      const b = { 'statusBar.background': '#ff0000' };
      expect(settingsIndexersAreEqual(a, b)).toBe(false);
    });

    it('does not mutate input objects', () => {
      const a = { key1: 'val1', key2: 'val2' };
      const b = { key1: 'val1', key2: 'val2' };
      settingsIndexersAreEqual(a, b);
      expect(a).toEqual({ key1: 'val1', key2: 'val2' });
      expect(b).toEqual({ key1: 'val1', key2: 'val2' });
    });

    it('handles many Peacock color settings', () => {
      const colors = {
        'activityBar.background': '#ff0000',
        'activityBar.foreground': '#ffffff',
        'activityBarBadge.background': '#00ff00',
        'statusBar.background': '#ff0000',
        'statusBar.foreground': '#ffffff',
        'titleBar.activeBackground': '#ff0000',
        'titleBar.activeForeground': '#ffffff',
        'titleBar.inactiveBackground': '#ff000099',
        'titleBar.inactiveForeground': '#ffffff99',
      };
      const clone = { ...colors };
      expect(settingsIndexersAreEqual(colors, clone)).toBe(true);

      clone['statusBar.background'] = '#0000ff';
      expect(settingsIndexersAreEqual(colors, clone)).toBe(false);
    });
  });
});
