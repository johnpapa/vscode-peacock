import * as assert from 'assert';

import { createCssProfile } from '../../css-injection/profiles';
import {
  cssPatchEnd,
  cssPatchStart,
  CssPatchError,
  extractCssProfileRules,
  installCssProfiles,
  parseStylesheet,
  removeCssPatch,
} from '../../css-injection/stylesheet';

suite('CSS stylesheet patching', () => {
  const original = 'body{color:red;}\n/* another extension */\n';
  const blue = createCssProfile('#007fff', { 'statusBar.background': '#007fff' }, [], 1);
  const green = createCssProfile('#00ff00', { 'statusBar.background': '#00ff00' }, [], 2);

  test('installs one owned block and preserves surrounding CSS exactly', () => {
    const result = installCssProfiles(original, { [blue.id]: blue });
    const parts = parseStylesheet(result.content);

    assert.equal(result.changed, true);
    assert.equal(parts.before, original);
    assert.equal(parts.after, '');
    assert.deepEqual(Object.keys(extractCssProfileRules(parts.block)), [blue.id]);
  });

  test('is idempotent for the same profile registry', () => {
    const first = installCssProfiles(original, { [blue.id]: blue });
    const second = installCssProfiles(first.content, { [blue.id]: blue });

    assert.equal(second.changed, false);
    assert.equal(second.content, first.content);
  });

  test('merges a newly supplied profile with profiles written by another window', () => {
    const first = installCssProfiles(original, { [blue.id]: blue });
    const second = installCssProfiles(first.content, { [green.id]: green });

    assert.deepEqual(
      Object.keys(extractCssProfileRules(parseStylesheet(second.content).block)).sort(),
      [blue.id, green.id].sort(),
    );
  });

  test('removes only the owned block', () => {
    const installed = installCssProfiles(original, { [blue.id]: blue });
    const removed = removeCssPatch(installed.content);

    assert.equal(removed.changed, true);
    assert.equal(removed.content, original);
    assert.equal(removeCssPatch(original).changed, false);
  });

  test('refuses missing, reversed, duplicate, and malformed profile markers', () => {
    const invalidContents = [
      `${original}${cssPatchStart}broken`,
      `${original}${cssPatchEnd}${cssPatchStart}`,
      `${original}${cssPatchStart}${cssPatchEnd}${cssPatchStart}${cssPatchEnd}`,
      `${original}${cssPatchStart}/*__PEACOCK_CSS_PROFILE_START__:bad__*/${cssPatchEnd}`,
    ];

    invalidContents.forEach(content => {
      assert.throws(() => installCssProfiles(content, { [blue.id]: blue }), CssPatchError);
      assert.throws(() => removeCssPatch(content), CssPatchError);
    });
  });

  test('enforces the supplied profile limit while retaining the incoming profile', () => {
    const first = installCssProfiles(original, { [blue.id]: blue });
    const second = installCssProfiles(first.content, { [green.id]: green }, 1);

    assert.deepEqual(Object.keys(extractCssProfileRules(parseStylesheet(second.content).block)), [
      green.id,
    ]);
  });
});
