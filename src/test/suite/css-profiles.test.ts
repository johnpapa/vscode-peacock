import * as assert from 'assert';

import {
  createCssProfile,
  createCssProfileMarkerLabel,
  generateCssProfileRule,
  generateCssProfileRules,
  mergeCssProfiles,
} from '../../css-injection';

suite('CSS profiles', () => {
  test('converts sorted Peacock tokens into high-priority VS Code variables', () => {
    const profile = createCssProfile(
      '#007fff',
      {
        'titleBar.activeForeground': '#ffffff',
        'activityBar.background': '#0088ff',
        'statusBar.background': '#007fff',
      },
      [],
      1,
    );

    assert.deepEqual(profile.variables, {
      '--vscode-activityBar-background': '#0088ff',
      '--vscode-statusBar-background': '#007fff',
      '--vscode-titleBar-activeForeground': '#ffffff',
    });
    assert.ok(
      generateCssProfileRule(profile).includes('--vscode-statusBar-background:#007fff !important;'),
    );
  });

  test('does not emit excluded settings', () => {
    const profile = createCssProfile(
      '#007fff',
      {
        'statusBar.background': '#007fff',
        'titleBar.activeBackground': '#007fff',
      },
      ['statusBar.background'],
      1,
    );

    assert.equal(profile.variables['--vscode-statusBar-background'], undefined);
    assert.equal(profile.variables['--vscode-titleBar-activeBackground'], '#007fff');
  });

  test('fingerprints the complete derived style rather than only the base color', () => {
    const first = createCssProfile('#007fff', { 'statusBar.background': '#007fff' }, [], 1);
    const same = createCssProfile('#007fff', { 'statusBar.background': '#007fff' }, [], 2);
    const changed = createCssProfile('#007fff', { 'statusBar.background': '#0066cc' }, [], 3);

    assert.equal(first.id, same.id);
    assert.notEqual(first.id, changed.id);
    assert.equal(
      createCssProfileMarkerLabel(first),
      `Peacock CSS profile ${first.id}; color #007fff`,
    );
  });

  test('generates deterministic rules regardless of registry insertion order', () => {
    const first = createCssProfile('#ff0000', { 'statusBar.background': '#ff0000' }, [], 1);
    const second = createCssProfile('#00ff00', { 'statusBar.background': '#00ff00' }, [], 2);

    assert.equal(
      generateCssProfileRules({ [first.id]: first, [second.id]: second }),
      generateCssProfileRules({ [second.id]: second, [first.id]: first }),
    );
  });

  test('keeps the most recently used profiles within the registry limit', () => {
    const profiles = [
      createCssProfile('#111111', { 'statusBar.background': '#111111' }, [], 1),
      createCssProfile('#222222', { 'statusBar.background': '#222222' }, [], 2),
      createCssProfile('#333333', { 'statusBar.background': '#333333' }, [], 3),
    ];
    const registry = mergeCssProfiles({}, profiles, 2);

    assert.equal(Object.keys(registry).length, 2);
    assert.equal(registry[profiles[0].id], undefined);
    assert.ok(registry[profiles[1].id]);
    assert.ok(registry[profiles[2].id]);
  });

  test('refreshes last-used time without duplicating a profile', () => {
    const oldProfile = createCssProfile('#007fff', { 'statusBar.background': '#007fff' }, [], 1);
    const refreshed = { ...oldProfile, lastUsed: 10 };
    const registry = mergeCssProfiles({ [oldProfile.id]: oldProfile }, [refreshed]);

    assert.equal(Object.keys(registry).length, 1);
    assert.equal(registry[oldProfile.id].lastUsed, 10);
  });
});
