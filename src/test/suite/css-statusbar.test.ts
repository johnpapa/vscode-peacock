import * as assert from 'assert';

import { createCssProfile, createCssProfileMarkerLabel } from '../../css-injection';
import { getStatusBarItem, setCssProfileStatusBar } from '../../statusbar';

suite('CSS status bar profile marker', () => {
  teardown(() => setCssProfileStatusBar(undefined));

  test('exposes the complete profile fingerprint through its accessibility label', () => {
    const profile = createCssProfile('#007fff', { 'statusBar.background': '#007fff' }, [], 1);

    setCssProfileStatusBar(profile);

    assert.equal(
      getStatusBarItem().accessibilityInformation?.label,
      createCssProfileMarkerLabel(profile),
    );
  });
});
