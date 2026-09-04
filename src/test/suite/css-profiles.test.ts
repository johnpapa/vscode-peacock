import * as assert from 'assert';

import {
  createCssProfile,
  generateCssProfileRule,
  mergeCssProfiles,
} from '../../css-injection/profiles';

suite('CSS profiles', () => {
  const profileFor = (color: string, lastUsed: number) =>
    createCssProfile(color, { 'statusBar.background': color }, [], lastUsed);

  test('compiles Peacock tokens into high-priority variables and workbench surface rules', () => {
    const profile = createCssProfile(
      '#007fff',
      {
        'activityBar.background': '#0088ff',
        'activityBar.foreground': '#15202b',
        'activityBar.inactiveForeground': '#15202b99',
        'statusBar.background': '#007fff',
        'statusBar.foreground': '#15202b',
        'titleBar.activeBackground': '#007fff',
        'titleBar.activeForeground': '#15202b',
      },
      [],
      1,
    );
    const css = generateCssProfileRule(profile);

    assert.ok(css.includes('--vscode-statusBar-background:#007fff !important;'));
    assert.ok(
      /\.part\.activitybar\{[^}]*--vscode-foreground:#15202b !important;[^}]*--vscode-icon-foreground:#15202b99 !important;/.test(
        css,
      ),
    );
    [
      '.action-item .action-label.codicon{color:#15202b99 !important;}',
      '.action-item .action-label:not(.codicon){background-color:#15202b99 !important;}',
      '.action-item.checked .action-label.codicon{color:#15202b !important;}',
      '.action-item.checked .action-label:not(.codicon){background-color:#15202b !important;}',
    ].forEach(rule => assert.ok(css.includes(rule)));
    assert.ok(
      css.includes(
        '.part.statusbar{background-color:#007fff !important;color:#15202b !important;}',
      ),
    );
    assert.ok(
      /\.part\.titlebar\{[^}]*--vscode-foreground:#15202b !important;[^}]*--vscode-descriptionForeground:#15202b !important;/.test(
        css,
      ),
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

    assert.ok(!generateCssProfileRule(profile).includes('--vscode-statusBar-background'));
    assert.ok(!generateCssProfileRule(profile).includes('.part.statusbar{'));
  });

  test('fingerprints the complete derived style rather than only the base color', () => {
    const first = createCssProfile('#007fff', { 'statusBar.background': '#007fff' }, [], 1);
    const same = createCssProfile('#007fff', { 'statusBar.background': '#007fff' }, [], 2);
    const changed = createCssProfile('#007fff', { 'statusBar.background': '#0066cc' }, [], 3);

    assert.equal(first.id, same.id);
    assert.notEqual(first.id, changed.id);
  });

  test('keeps recently used profiles without duplicating refreshed entries', () => {
    const first = profileFor('#111111', 1);
    const second = profileFor('#222222', 2);
    const third = profileFor('#333333', 3);
    const registry = mergeCssProfiles(
      { [first.id]: first },
      [second, third, { ...first, lastUsed: 4 }],
      2,
    );

    assert.equal(Object.keys(registry).length, 2);
    assert.ok(registry[first.id]);
    assert.ok(registry[third.id]);
  });
});
