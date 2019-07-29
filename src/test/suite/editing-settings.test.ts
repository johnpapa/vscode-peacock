import vscode = require('vscode');
import sinon = require('sinon');
import assert = require('assert');

import {
  IPeacockSettings,
  peacockGreen,
  azureBlue,
  StandardSettings,
  extensionShortName,
} from '../../models';
import { setupTestSuite, teardownTestSuite } from './lib/setup-teardown-test-suite';

import { getPeacockRemoteColor, getCurrentColorBeforeAdjustments } from '../../configuration';
import { RemoteNames } from '../../remote';
import { applyColor } from '../../apply-color';
import { ConfigurationTarget } from 'vscode';

const remoteSection = `${extensionShortName}.${StandardSettings.RemoteColor}`;

suite.only('Manual Editing of Settings', () => {
  let originalValues = <IPeacockSettings>{};
  const yellow = `#ffff00`;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));

  /**
   * These tests can't reset colors before each test
   * because these tests are modifying the
   * colors (peacock.remoteColor and peacock. color).
   */
  // setup(async () => await setupTest());

  suite('when in remote and manually changing the User Settings remoteColor', async () => {
    let remoteNameStub: sinon.SinonStub<any>;
    suite(
      'when User Settings remoteColor is a GREEN and Workspace remoteColor is BLUE',
      async () => {
        suiteSetup(async () => {
          await updateRemoteColorInUserSettings(peacockGreen);
          await updateRemoteColorInWorkspace(azureBlue);
        });
        setup(async () => {
          // Go to remote env
          remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.wsl);
          // Set remote color
          await applyColor(getPeacockRemoteColor());
        });
        teardown(() => {
          remoteNameStub.restore();
        });

        test('user changes User Settings remoteColor to YELLOW, color should remain BLUE', async () => {
          await updateRemoteColorInUserSettings(yellow);
          await applyColor(getPeacockRemoteColor());
          let appliedColor = getCurrentColorBeforeAdjustments();
          assert.equal(appliedColor, azureBlue);
        });

        test('user removes User Settings remoteColor, color should remain BLUE', async () => {
          await updateRemoteColorInUserSettings(undefined);
          await applyColor(getPeacockRemoteColor());
          let appliedColor = getCurrentColorBeforeAdjustments();
          assert.equal(appliedColor, azureBlue);
        });
      },
    );
    suite(
      'when User Settings remoteColor is a GREEN and Workspace remoteColor is undefined',
      async () => {
        suiteSetup(async () => {
          await updateRemoteColorInUserSettings(peacockGreen);
          await updateRemoteColorInWorkspace(undefined);
        });
        setup(async () => {
          // Go to remote env
          remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.wsl);
          // Set remote color
          await applyColor(getPeacockRemoteColor());
        });
        teardown(() => {
          remoteNameStub.restore();
        });

        test('user changes User Settings remoteColor to YELLOW, color should be YELLOW', async () => {
          await updateRemoteColorInUserSettings(yellow);
          await applyColor(getPeacockRemoteColor());
          let appliedColor = getCurrentColorBeforeAdjustments();
          assert.equal(appliedColor, yellow);
        });

        test('user removes User Settings remoteColor, color should be unapplied', async () => {
          await updateRemoteColorInUserSettings(undefined);
          await applyColor(getPeacockRemoteColor());
          let appliedColor = getCurrentColorBeforeAdjustments();
          assert.ok(!appliedColor);
        });
      },
    );
  });
});

const updateRemoteColorInWorkspace = async (color: any) => {
  return await vscode.workspace
    .getConfiguration()
    .update(remoteSection, color, ConfigurationTarget.Workspace);
};
const updateRemoteColorInUserSettings = async (color: any) => {
  return await vscode.workspace
    .getConfiguration()
    .update(remoteSection, color, ConfigurationTarget.Global);
};
