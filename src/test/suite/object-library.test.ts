import * as assert from 'assert';
import { sortSettingsIndexer, settingsIndexersAreEqual } from '../../object-library';

suite('Object Library', () => {
  suite('sortSettingsIndexer', () => {
    test('returns keys in alphabetical order', () => {
      const unordered = { zebra: '#000', apple: '#111', mango: '#222' };
      const ordered = sortSettingsIndexer(unordered);
      const keys = Object.keys(ordered);
      assert.deepStrictEqual(keys, ['apple', 'mango', 'zebra']);
    });

    test('preserves values after sorting', () => {
      const unordered = { b: '#222', a: '#111' };
      const ordered = sortSettingsIndexer(unordered);
      assert.equal(ordered['a'], '#111');
      assert.equal(ordered['b'], '#222');
    });

    test('handles empty object', () => {
      const ordered = sortSettingsIndexer({});
      assert.deepStrictEqual(ordered, {});
    });

    test('handles single key', () => {
      const ordered = sortSettingsIndexer({ only: '#fff' });
      assert.deepStrictEqual(Object.keys(ordered), ['only']);
    });
  });

  suite('settingsIndexersAreEqual', () => {
    test('returns true for identical objects', () => {
      const a = { 'titleBar.activeBackground': '#ff0000', 'statusBar.background': '#00ff00' };
      const b = { 'titleBar.activeBackground': '#ff0000', 'statusBar.background': '#00ff00' };
      assert.ok(settingsIndexersAreEqual(a, b));
    });

    test('returns true for two empty objects', () => {
      assert.ok(settingsIndexersAreEqual({}, {}));
    });

    test('returns false when key counts differ', () => {
      const a = { 'titleBar.activeBackground': '#ff0000' };
      const b = { 'titleBar.activeBackground': '#ff0000', 'statusBar.background': '#00ff00' };
      assert.ok(!settingsIndexersAreEqual(a, b));
    });

    test('returns false when a is empty and b has keys', () => {
      assert.ok(!settingsIndexersAreEqual({}, { key: 'value' }));
    });

    test('returns false when values differ for same keys', () => {
      const a = { 'titleBar.activeBackground': '#ff0000' };
      const b = { 'titleBar.activeBackground': '#00ff00' };
      assert.ok(!settingsIndexersAreEqual(a, b));
    });

    test('returns false when keys differ but count is same', () => {
      const a = { 'titleBar.activeBackground': '#ff0000' };
      const b = { 'statusBar.background': '#ff0000' };
      assert.ok(!settingsIndexersAreEqual(a, b));
    });

    test('does not mutate input objects', () => {
      const a = { key1: 'val1', key2: 'val2' };
      const b = { key1: 'val1', key2: 'val2' };
      settingsIndexersAreEqual(a, b);
      assert.deepStrictEqual(a, { key1: 'val1', key2: 'val2' });
      assert.deepStrictEqual(b, { key1: 'val1', key2: 'val2' });
    });

    test('handles many Peacock color settings', () => {
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
      assert.ok(settingsIndexersAreEqual(colors, clone));

      clone['statusBar.background'] = '#0000ff';
      assert.ok(!settingsIndexersAreEqual(colors, clone));
    });
  });
});
