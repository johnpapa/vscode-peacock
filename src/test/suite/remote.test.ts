import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as assert from 'assert';

import {
  IPeacockSettings,
  ColorSettings,
  Commands,
  peacockGreen,
  azureBlue,
  StandardSettings,
} from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { isValidColorInput } from '../../color-library';
import { executeCommand, stubQuickPick } from './lib/constants';

import {
  getColorCustomizationConfig,
  getEnvironmentAwareColor,
  getPeacockWorkspace,
  updatePeacockColor,
  updatePeacockRemoteColor,
  getPeacockRemoteColor,
} from '../../configuration';
import { RemoteNames } from '../../remote';
import { applyColor } from '../../apply-color';

suite('Remote Integration', () => {
  const originalValues = {} as IPeacockSettings;
  const azureBlueResponse = `Azure Blue -> ${azureBlue}`;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  test('when in remote, and peacock.color is empty and peacock.remoteColor is a color, remote color should be applied', async () => {
    await updatePeacockColor(undefined);
    await updatePeacockRemoteColor(peacockGreen);

    // Go to remote env
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.wsl);
    // Set remote color
    await applyColor(getPeacockRemoteColor());

    const peacockRemoteColor = getEnvironmentAwareColor();
    remoteNameStub.restore();

    const config = getPeacockWorkspace();
    const remoteColorInSettings = config[StandardSettings.RemoteColor];
    const colorInSettings = config[StandardSettings.Color];

    assert.equal(remoteColorInSettings, peacockRemoteColor);
    assert.equal(colorInSettings, '');
  });

  test('when in remote and we go out of remote, and peacock.color is empty and peacock.remoteColor is a color, colors should be unapplied ', async () => {
    await updatePeacockColor(undefined);
    await updatePeacockRemoteColor(peacockGreen);

    // Go to remote env
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.wsl);
    // Set remote color
    await applyColor(getPeacockRemoteColor());
    const peacockRemoteColor = getEnvironmentAwareColor();
    remoteNameStub.restore();

    // Go to local env
    const remoteNameStub2 = sinon.stub(vscode.env, 'remoteName').value(undefined);
    // Follow the logic that runs when we activate ...
    const color = getEnvironmentAwareColor();
    await applyColor(color);

    const peacockLocalColor = getEnvironmentAwareColor();
    remoteNameStub2.restore();

    const config = getPeacockWorkspace();
    const remoteColorInSettings = config[StandardSettings.RemoteColor];
    const colorInSettings = config[StandardSettings.Color];

    assert.equal(colorInSettings, '', 'Applied colors should not exist');
    assert.equal(colorInSettings, peacockLocalColor, 'There should be no peacock color');
    assert.equal(peacockRemoteColor, remoteColorInSettings, 'Remote color should not change');
    assert.ok(remoteColorInSettings, 'Remote color should exist');
    assert.ok(
      remoteColorInSettings !== colorInSettings,
      'Remote color should not equal regular color',
    );
  });

  test('can set to remote color and it is stored in workspace config', async () => {
    await updatePeacockColor(undefined);
    await updatePeacockRemoteColor(peacockGreen);
    // Go to remote env and set to blue
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.wsl);
    const qpStub2 = await stubQuickPick(azureBlueResponse);
    await executeCommand(Commands.changeColorToFavorite);
    const peacockRemoteColor = getEnvironmentAwareColor();
    qpStub2.restore();
    remoteNameStub.restore();

    const config = getPeacockWorkspace();
    const colorInSettings = config[StandardSettings.RemoteColor];
    assert.ok(colorInSettings);
    assert.equal(colorInSettings, peacockRemoteColor);
  });

  test('when setting remote, remote color is different than local color', async () => {
    await updatePeacockColor(peacockGreen);
    await updatePeacockRemoteColor(azureBlue);
    const peacockColor = getEnvironmentAwareColor();

    // Go to remote env and set to blue
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.wsl);
    const qpStub2 = await stubQuickPick(azureBlueResponse);
    await executeCommand(Commands.changeColorToFavorite);
    const peacockRemoteColor = getEnvironmentAwareColor();
    qpStub2.restore();
    remoteNameStub.restore();

    // colors should be different
    assert.ok(peacockRemoteColor, azureBlue);
    assert.ok(peacockColor, peacockGreen);
    assert.ok(peacockRemoteColor !== peacockColor);
  });

  test('can set color when in a Remote WSL', async () => {
    await updatePeacockColor(peacockGreen);
    const peacockColor = getEnvironmentAwareColor();

    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.wsl);
    const qpStub = await stubQuickPick(azureBlueResponse);
    await executeCommand(Commands.changeColorToFavorite);
    const peacockRemoteColor = getEnvironmentAwareColor();
    qpStub.restore();
    remoteNameStub.restore();

    assert.equal(peacockRemoteColor, azureBlue);
    assert.ok(peacockRemoteColor !== peacockColor);
  });

  test('can set color when in a Remote SSH', async () => {
    await updatePeacockColor(peacockGreen);
    const peacockColor = getEnvironmentAwareColor();

    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.sshRemote);
    const qpStub = await stubQuickPick(azureBlueResponse);
    await executeCommand(Commands.changeColorToFavorite);
    const peacockRemoteColor = getEnvironmentAwareColor();
    qpStub.restore();
    remoteNameStub.restore();

    assert.equal(peacockRemoteColor, azureBlue);
    assert.ok(peacockRemoteColor !== peacockColor);
  });

  test('can set color when in a Remote Container', async () => {
    await updatePeacockColor(peacockGreen);
    const peacockColor = getEnvironmentAwareColor();

    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.devContainer);
    const qpStub = await stubQuickPick(azureBlueResponse);
    await executeCommand(Commands.changeColorToFavorite);
    const peacockRemoteColor = getEnvironmentAwareColor();
    qpStub.restore();
    remoteNameStub.restore();

    assert.equal(peacockRemoteColor, azureBlue);
    assert.ok(peacockRemoteColor !== peacockColor);
  });

  test('Workspace color is updated when in Remote Containers context.', async () => {
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.devContainer);
    const qpStub = await stubQuickPick(azureBlueResponse);
    await executeCommand(Commands.changeColorToFavorite);
    qpStub.restore();
    remoteNameStub.restore();

    const config = getColorCustomizationConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    assert.ok(isValidColorInput(value));
    assert.equal(value, azureBlue);
  });

  test('Workspace color is updated when in Remote WSL context.', async () => {
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.wsl);
    const qpStub = await stubQuickPick(azureBlueResponse);
    await executeCommand(Commands.changeColorToFavorite);
    qpStub.restore();
    remoteNameStub.restore();

    const config = getColorCustomizationConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    assert(isValidColorInput(value));
    assert(value === azureBlue);
  });

  test('Workspace color is updated when in Remote SSH context.', async () => {
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.sshRemote);
    const qpStub = await stubQuickPick(azureBlueResponse);
    await executeCommand(Commands.changeColorToFavorite);
    qpStub.restore();
    remoteNameStub.restore();

    const config = getColorCustomizationConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    assert(isValidColorInput(value));
    assert(value === azureBlue);
  });

  test('Workspace color is reverted when not in a remote context.', async () => {
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(undefined);
    await executeCommand<vscode.ExtensionContext>(Commands.changeColorToPeacockGreen);
    remoteNameStub.restore();

    const config = getColorCustomizationConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    // we should be back to green
    assert.ok(isValidColorInput(value));
    assert.ok(value !== azureBlue);
    assert.equal(value, peacockGreen);
  });
});
