import * as assert from 'assert';
import { ExtensionMode } from 'vscode';

import { canUseCssInjection } from '../../css-injection/manager';

suite('CSS test-host safety', () => {
  test('disables stylesheet patching in an extension test host', () => {
    assert.equal(canUseCssInjection(ExtensionMode.Test), false);
    assert.equal(canUseCssInjection(ExtensionMode.Development), true);
    assert.equal(canUseCssInjection(ExtensionMode.Production), true);
  });
});
