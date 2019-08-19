import * as assert from 'assert';
import { IPeacockSettings } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { notify } from '../../notification';
import sinon = require('sinon');
import { Logger } from '../../logging';

suite('Notification Tests', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  test('Can fire notification without logging', () => {
    const loggerStub = sinon.stub(Logger, 'info');
    notify('test message');
    assert.ok(!loggerStub.called);
    loggerStub.restore();
  });

  test('Can fire notification with logging', () => {
    const loggerStub = sinon.stub(Logger, 'info');
    notify('test message', true);
    assert.ok(loggerStub.called);
    loggerStub.restore();
  });
});
