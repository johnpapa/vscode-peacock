import * as vscode from 'vscode';
import * as assert from 'assert';
import * as sinon from 'sinon';
import { Commands, IPeacockSettings, peacockGreen } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { executeCommand } from './lib/constants';
import { RemoteNames } from '../../remote';
import { getStatusBarItem } from '../../statusbar';
import { updatePeacockRemoteColor } from '../../configuration';

suite('StatusBar remote indicator (#392)', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  setup(async () => {
    await executeCommand(Commands.changeColorToPeacockGreen);
  });

  test('clicking the status bar opens Choose a Custom Color, pre-filled with the current color (#708 follow-up)', async () => {
    const sb = getStatusBarItem();
    assert.equal(sb.command, Commands.enterColor);
  });

  test('does not prefix the status bar text when not in a remote context', async () => {
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(undefined);
    try {
      const sb = getStatusBarItem();
      assert.ok(!sb.text.startsWith('$(remote)'));
      assert.ok(sb.text.includes(peacockGreen));
      assert.equal(sb.tooltip, 'Choose a Custom Color');
    } finally {
      remoteNameStub.restore();
    }
  });

  test('prefixes the status bar text with a remote indicator when in a remote context', async () => {
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.sshRemote);
    try {
      // getEnvironmentAwareColor() reads peacock.remoteColor (not peacock.color)
      // once a remote context is active, so it must be set explicitly here.
      await updatePeacockRemoteColor(peacockGreen);

      const sb = getStatusBarItem();
      assert.ok(sb.text.startsWith('$(remote) $(paintcan)'));
      assert.ok(sb.text.includes(peacockGreen));
      assert.equal(sb.tooltip, `Choose a Custom Color (remote: ${RemoteNames.sshRemote})`);
    } finally {
      remoteNameStub.restore();
    }
  });
});
