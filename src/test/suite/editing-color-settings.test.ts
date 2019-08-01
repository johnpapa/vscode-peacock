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
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';

import {
  getPeacockRemoteColor,
  getCurrentColorBeforeAdjustments,
  getPeacockColor,
} from '../../configuration';
import { RemoteNames } from '../../remote';
import { applyColor } from '../../apply-color';
import { ConfigurationTarget } from 'vscode';

const remoteSection = `${extensionShortName}.${StandardSettings.RemoteColor}`;
const localSection = `${extensionShortName}.${StandardSettings.Color}`;

suite('Manual Editing of Settings', () => {
  let originalValues = <IPeacockSettings>{};
  const yellow = `#ffff00`;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  suite('when in remote and manually changing the User Settings remoteColor', async () => {
    let remoteNameStub: sinon.SinonStub<any>;

    suite(
      'when User Settings remoteColor is a GREEN and Workspace remoteColor is BLUE',
      async () => {
        setup(async () => {
          remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.wsl);
          await updateRemoteColorInUserSettings(peacockGreen);
          await updateRemoteColorInWorkspace(azureBlue);
          await applyColor(getPeacockRemoteColor());
        });
        teardown(() => {
          remoteNameStub.restore();
        });

        test('color-customizations should be BLUE', async () => {
          let appliedColor = getCurrentColorBeforeAdjustments();
          assert.equal(appliedColor, azureBlue);
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
      'when User Settings remoteColor is GREEN and Workspace remoteColor is undefined',
      async () => {
        setup(async () => {
          remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.wsl);
          await updateRemoteColorInUserSettings(peacockGreen);
          await updateRemoteColorInWorkspace(undefined);
          await applyColor(getPeacockRemoteColor());
        });
        teardown(() => {
          remoteNameStub.restore();
        });

        test('color-customizations should be GREEN', async () => {
          let appliedColor = getCurrentColorBeforeAdjustments();
          assert.equal(appliedColor, peacockGreen);
        });

        test('user changes User Settings remoteColor to YELLOW, color-customizations should be YELLOW', async () => {
          await updateRemoteColorInUserSettings(yellow);
          await applyColor(getPeacockRemoteColor());
          let appliedColor = getCurrentColorBeforeAdjustments();
          assert.equal(appliedColor, yellow);
        });

        test('user removes User Settings remoteColor, color-customizations should be unapplied', async () => {
          await updateRemoteColorInUserSettings(undefined);
          await applyColor(getPeacockRemoteColor());
          let appliedColor = getCurrentColorBeforeAdjustments();
          assert.ok(!appliedColor);
        });
      },
    );

    suite('when User Settings color is a undefined and Workspace color is BLUE', async () => {
      setup(async () => {
        remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.wsl);
        await updateLocalColorInUserSettings(undefined);
        await updateLocalColorInWorkspace(azureBlue);
        await applyColor(getPeacockColor());
      });
      teardown(() => {
        remoteNameStub.restore();
      });

      test('color-customizations should be BLUE', async () => {
        let appliedColor = getCurrentColorBeforeAdjustments();
        assert.equal(appliedColor, azureBlue);
      });

      test('user changes User Settings color to YELLOW, color-customizations should be BLUE', async () => {
        await updateLocalColorInUserSettings(yellow);
        await applyColor(getPeacockColor());
        let appliedColor = getCurrentColorBeforeAdjustments();
        assert.equal(appliedColor, azureBlue);
      });

      test('user removes Workspace Settings color, color-customizations should be unapplied', async () => {
        await updateLocalColorInWorkspace(undefined);
        await applyColor(getPeacockColor());
        let appliedColor = getCurrentColorBeforeAdjustments();
        assert.ok(!appliedColor);
      });
    });

    suite('when User Settings color is a undefined and Workspace color is undefined', async () => {
      setup(async () => {
        remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.wsl);
        await updateLocalColorInUserSettings(undefined);
        await updateLocalColorInWorkspace(undefined);
        await applyColor(getPeacockColor());
      });
      teardown(() => {
        remoteNameStub.restore();
      });

      test('color-customizations should be undefined', async () => {
        let appliedColor = getCurrentColorBeforeAdjustments();
        assert.ok(!appliedColor);
      });

      test('user changes User Settings color to YELLOW, color-customizations should be YELLOW', async () => {
        await updateLocalColorInUserSettings(yellow);
        await applyColor(getPeacockColor());
        let appliedColor = getCurrentColorBeforeAdjustments();
        assert.equal(appliedColor, yellow);
      });

      test('user changes Workspace Settings color to BLUE, color-customizations should be BLUE', async () => {
        await updateLocalColorInWorkspace(azureBlue);
        await applyColor(getPeacockColor());
        let appliedColor = getCurrentColorBeforeAdjustments();
        assert.equal(appliedColor, azureBlue);
      });
    });
  });

  suite('when in local and manually changing the User Settings color', async () => {
    let remoteNameStub: sinon.SinonStub<any>;

    suite('when User Settings color is GREEN and Workspace color is BLUE', async () => {
      setup(async () => {
        remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(undefined);
        await updateLocalColorInUserSettings(peacockGreen);
        await updateLocalColorInWorkspace(azureBlue);
        await applyColor(getPeacockColor());
      });
      teardown(() => {
        remoteNameStub.restore();
      });

      test('color-customizations should be BLUE', async () => {
        let appliedColor = getCurrentColorBeforeAdjustments();
        assert.equal(appliedColor, azureBlue);
      });

      test('user changes User Settings color to YELLOW, color should remain BLUE', async () => {
        await updateLocalColorInUserSettings(yellow);
        await applyColor(getPeacockColor());
        let appliedColor = getCurrentColorBeforeAdjustments();
        assert.equal(appliedColor, azureBlue);
      });

      test('user removes User Settings color, color should remain BLUE', async () => {
        await updateLocalColorInUserSettings(undefined);
        await applyColor(getPeacockColor());
        let appliedColor = getCurrentColorBeforeAdjustments();
        assert.equal(appliedColor, azureBlue);
      });
    });

    suite('when User Settings color is a GREEN and Workspace color is undefined', async () => {
      setup(async () => {
        remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(undefined);
        await updateLocalColorInUserSettings(peacockGreen);
        await updateLocalColorInWorkspace(undefined);
        await applyColor(getPeacockColor());
      });
      teardown(() => {
        remoteNameStub.restore();
      });

      test('color-customizations should be GREEN', async () => {
        let appliedColor = getCurrentColorBeforeAdjustments();
        assert.equal(appliedColor, peacockGreen);
      });

      test('user changes User Settings color to YELLOW, color-customizations should be YELLOW', async () => {
        await updateLocalColorInUserSettings(yellow);
        await applyColor(getPeacockColor());
        let appliedColor = getCurrentColorBeforeAdjustments();
        assert.equal(appliedColor, yellow);
      });

      test('user removes User Settings color, color-customizations should be unapplied', async () => {
        await updateLocalColorInUserSettings(undefined);
        await applyColor(getPeacockColor());
        let appliedColor = getCurrentColorBeforeAdjustments();
        assert.ok(!appliedColor);
      });
    });

    suite('when User Settings color is a undefined and Workspace color is BLUE', async () => {
      setup(async () => {
        remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(undefined);
        await updateLocalColorInUserSettings(undefined);
        await updateLocalColorInWorkspace(azureBlue);
        await applyColor(getPeacockColor());
      });
      teardown(() => {
        remoteNameStub.restore();
      });

      test('color-customizations should be BLUE', async () => {
        let appliedColor = getCurrentColorBeforeAdjustments();
        assert.equal(appliedColor, azureBlue);
      });

      test('user changes User Settings color to YELLOW, color-customizations should be BLUE', async () => {
        await updateLocalColorInUserSettings(yellow);
        await applyColor(getPeacockColor());
        let appliedColor = getCurrentColorBeforeAdjustments();
        assert.equal(appliedColor, azureBlue);
      });

      test('user removes Workspace Settings color, color-customizations should be unapplied', async () => {
        await updateLocalColorInWorkspace(undefined);
        await applyColor(getPeacockColor());
        let appliedColor = getCurrentColorBeforeAdjustments();
        assert.ok(!appliedColor);
      });
    });

    suite('when User Settings color is a undefined and Workspace color is undefined', async () => {
      setup(async () => {
        remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(undefined);
        await updateLocalColorInUserSettings(undefined);
        await updateLocalColorInWorkspace(undefined);
        await applyColor(getPeacockColor());
      });
      teardown(() => {
        remoteNameStub.restore();
      });

      test('color-customizations should be undefined', async () => {
        let appliedColor = getCurrentColorBeforeAdjustments();
        assert.ok(!appliedColor);
      });

      test('user changes User Settings color to YELLOW, color-customizations should be YELLOW', async () => {
        await updateLocalColorInUserSettings(yellow);
        await applyColor(getPeacockColor());
        let appliedColor = getCurrentColorBeforeAdjustments();
        assert.equal(appliedColor, yellow);
      });

      test('user changes Workspace Settings color to BLUE, color-customizations should be BLUE', async () => {
        await updateLocalColorInWorkspace(azureBlue);
        await applyColor(getPeacockColor());
        let appliedColor = getCurrentColorBeforeAdjustments();
        assert.equal(appliedColor, azureBlue);
      });
    });
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
const updateLocalColorInWorkspace = async (color: any) => {
  return await vscode.workspace
    .getConfiguration()
    .update(localSection, color, ConfigurationTarget.Workspace);
};
const updateLocalColorInUserSettings = async (color: any) => {
  return await vscode.workspace
    .getConfiguration()
    .update(localSection, color, ConfigurationTarget.Global);
};
