import * as assert from 'assert';
import * as vscode from 'vscode';
import sinon = require('sinon');
import { ConfigurationTarget } from 'vscode';

import { IPeacockSettings, peacockGreen, azureBlue } from '../../models';
import { applyColor, resetModernUICompatibilityNoticeForTests } from '../../apply-color';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';

suite('Modern UI Compatibility Tests', () => {
  const originalValues = {} as IPeacockSettings;
  let originalModernUISetting: boolean | undefined;

  suiteSetup(async () => {
    await setupTestSuite(originalValues);
    originalModernUISetting = vscode.workspace
      .getConfiguration('workbench')
      .get<boolean>('experimental.modernUI');
  });

  suiteTeardown(async () => {
    await vscode.workspace
      .getConfiguration('workbench')
      .update('experimental.modernUI', originalModernUISetting, ConfigurationTarget.Workspace);
    await teardownTestSuite(originalValues);
  });

  setup(async () => {
    await setupTest();
    resetModernUICompatibilityNoticeForTests();
    await vscode.workspace
      .getConfiguration('workbench')
      .update('experimental.modernUI', undefined, ConfigurationTarget.Workspace);
  });

  test('Shows a compatibility notice when modernUI is enabled', async () => {
    await vscode.workspace
      .getConfiguration('workbench')
      .update('experimental.modernUI', true, ConfigurationTarget.Workspace);

    const notificationStub = sinon.stub(vscode.window, 'showInformationMessage');
    await applyColor(peacockGreen);

    assert.ok(notificationStub.calledOnce);
    assert.ok(
      notificationStub.firstCall.args[0].includes('workbench.experimental.modernUI'),
    );
    assert.ok(notificationStub.firstCall.args[0].includes('/issues/652'));

    notificationStub.restore();
  });

  test('Shows modernUI compatibility notice only once per session', async () => {
    await vscode.workspace
      .getConfiguration('workbench')
      .update('experimental.modernUI', true, ConfigurationTarget.Workspace);

    const notificationStub = sinon.stub(vscode.window, 'showInformationMessage');
    await applyColor(peacockGreen);
    await applyColor(azureBlue);

    assert.ok(notificationStub.calledOnce);

    notificationStub.restore();
  });
});
