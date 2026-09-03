import * as assert from 'assert';

import { CssInjectionUnsupportedError } from '../../css-injection/css-patcher';
import { cssPatcher } from '../../css-injection/css-patcher-platform';

suite('CSS patcher web fallback', () => {
  test('reports unsupported and never accepts or writes a stylesheet', async () => {
    assert.equal(await cssPatcher.validate('/tmp/workbench.desktop.main.css'), false);
    await assert.rejects(cssPatcher.locate(), CssInjectionUnsupportedError);
    await assert.rejects(
      cssPatcher.install('/tmp/workbench.desktop.main.css', {}),
      CssInjectionUnsupportedError,
    );
    await assert.rejects(
      cssPatcher.remove('/tmp/workbench.desktop.main.css'),
      CssInjectionUnsupportedError,
    );
  });
});
