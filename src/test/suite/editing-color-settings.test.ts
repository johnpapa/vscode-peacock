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
  getCurrentColorBeforeAdjustments,
  getPeacockColor,
  getPeacockRemoteColor,
} from '../../configuration';
import { RemoteNames } from '../../remote';
import { applyColor } from '../../apply-color';
import { ConfigurationTarget } from 'vscode';

const remoteSection = `${extensionShortName}.${StandardSettings.RemoteColor}`;
const localSection = `${extensionShortName}.${StandardSettings.Color}`;

suite('Manual Editing of Settings', () => {
  const originalValues = {} as IPeacockSettings;
  const yellow = `#ffff00`;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  test('workspace remote color takes precedence over user remote color', async () => {
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.wsl);
    await updateRemoteColorInUserSettings(peacockGreen);
    await updateRemoteColorInWorkspace(azureBlue);
    await applyColor(getPeacockRemoteColor());
    remoteNameStub.restore();

    assert.equal(getCurrentColorBeforeAdjustments(), azureBlue);
  });

  test('user remote color applies when workspace remote color is undefined', async () => {
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.wsl);
    await updateRemoteColorInUserSettings(yellow);
    await updateRemoteColorInWorkspace(undefined);
    await applyColor(getPeacockRemoteColor());
    remoteNameStub.restore();

    assert.equal(getCurrentColorBeforeAdjustments(), yellow);
  });

  test('workspace local color takes precedence over user local color', async () => {
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(undefined);
    await updateLocalColorInUserSettings(peacockGreen);
    await updateLocalColorInWorkspace(azureBlue);
    await applyColor(getPeacockColor());
    remoteNameStub.restore();

    assert.equal(getCurrentColorBeforeAdjustments(), azureBlue);
  });

  test('user local color applies when workspace local color is undefined', async () => {
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(undefined);
    await updateLocalColorInUserSettings(yellow);
    await updateLocalColorInWorkspace(undefined);
    await applyColor(getPeacockColor());
    remoteNameStub.restore();

    assert.equal(getCurrentColorBeforeAdjustments(), yellow);
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
