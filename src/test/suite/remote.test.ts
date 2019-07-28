import vscode = require('vscode');
import sinon = require('sinon');
import assert = require('assert');

import {
  IPeacockSettings,
  ColorSettings,
  Commands,
  peacockGreen,
  azureBlue,
  StandardSettings,
} from '../../models';
import { setupTestSuite, setupTest, teardownTestSuite } from './lib/setup-teardown-test-suite';
import { isValidColorInput, changeColor } from '../../color-library';
import { executeCommand } from './lib/constants';

import {
  getPeacockWorkspaceColorCustomizationConfig,
  getEnvironmentAwareColor,
  getPeacockWorkspace,
  updatePeacockColor,
  updatePeacockRemoteColor,
} from '../../configuration';
import { RemoteNames, setRemoteWorkspaceColors } from '../../remote';

suite('Remote Integration', () => {
  let originalValues = <IPeacockSettings>{};
  const azureBlueResponse = `Azure Blue -> ${azureBlue}`;
  const peacockGreenResponse = `Peacock Green -> ${peacockGreen}`;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  test('when in remote, and peacock.color is empty and peacock.remoteColor is a color, remote color should be applied', async () => {
    await updatePeacockColor('');
    await updatePeacockRemoteColor(peacockGreen);

    // Go to remote env
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.wsl);
    await setRemoteWorkspaceColors();
    const peacockRemoteColor = getEnvironmentAwareColor();
    remoteNameStub.restore();

    let config = getPeacockWorkspace();
    const remoteColorInSettings = config[StandardSettings.RemoteColor];
    const colorInSettings = config[StandardSettings.Color];

    assert.equal(remoteColorInSettings, peacockRemoteColor);
    assert.equal(colorInSettings, '');
  });

  test('when in remote and we go out of remote, and peacock.color is empty and peacock.remoteColor is a color, colors should be unapplied ', async () => {
    await updatePeacockColor('');
    await updatePeacockRemoteColor(peacockGreen);

    // Go to remote env
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.wsl);
    await setRemoteWorkspaceColors();
    // const peacockRemoteColor = getEnvironmentAwareColor();
    remoteNameStub.restore();

    // Go to local env
    const remoteNameStub2 = sinon.stub(vscode.env, 'remoteName').value(undefined);
    // Follow the logic that runs when we activate ...
    const color = getEnvironmentAwareColor();
    await changeColor(color);

    const peacockLocalColor = getEnvironmentAwareColor();
    remoteNameStub2.restore();

    let config = getPeacockWorkspace();
    const remoteColorInSettings = config[StandardSettings.RemoteColor];
    const colorInSettings = config[StandardSettings.Color];

    assert.equal(colorInSettings, '', 'Applied colors should not exist');
    assert.equal(colorInSettings, peacockLocalColor, 'There should be no peacock color');
    assert.ok(remoteColorInSettings, 'Remote color should exist');
    assert.ok(
      remoteColorInSettings !== colorInSettings,
      'Remote color should not equal regular color',
    );
  });

  test('can set to remote color and it is stored in workspace config', async () => {
    // Go to remote env and set to blue
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.wsl);
    const qpStub2 = await stubQuickPick(azureBlueResponse);
    await executeCommand(Commands.changeColorToFavorite);
    const peacockRemoteColor = getEnvironmentAwareColor();
    qpStub2.restore();
    remoteNameStub.restore();

    let config = getPeacockWorkspace();
    const colorInSettings = config[StandardSettings.RemoteColor];
    assert.ok(colorInSettings);
    assert.equal(colorInSettings, peacockRemoteColor);
  });

  test('when setting remote, remote color is different than regular color', async () => {
    // Set to green
    const qpStub1 = await stubQuickPick(peacockGreenResponse);
    await executeCommand(Commands.changeColorToFavorite);
    const peacockColor = getEnvironmentAwareColor();
    qpStub1.restore();

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
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.wsl);
    const qpStub = await stubQuickPick(azureBlueResponse);
    await executeCommand(Commands.changeColorToFavorite);
    const peacockRemoteColor = getEnvironmentAwareColor();
    qpStub.restore();
    remoteNameStub.restore();
    const peacockColor = getEnvironmentAwareColor();

    assert.equal(peacockRemoteColor, azureBlue);
    assert.ok(peacockRemoteColor !== peacockColor);
  });

  test('can set color when in a Remote SSH', async () => {
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.sshRemote);
    const qpStub = await stubQuickPick(azureBlueResponse);
    await executeCommand(Commands.changeColorToFavorite);
    const peacockRemoteColor = getEnvironmentAwareColor();
    qpStub.restore();
    remoteNameStub.restore();
    const peacockColor = getEnvironmentAwareColor();

    assert.equal(peacockRemoteColor, azureBlue);
    assert.ok(peacockRemoteColor !== peacockColor);
  });

  test('can set color when in a Remote Container', async () => {
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.devContainer);
    const qpStub = await stubQuickPick(azureBlueResponse);
    await executeCommand(Commands.changeColorToFavorite);
    const peacockRemoteColor = getEnvironmentAwareColor();
    qpStub.restore();
    remoteNameStub.restore();
    const peacockColor = getEnvironmentAwareColor();

    assert.equal(peacockRemoteColor, azureBlue);
    assert.ok(peacockRemoteColor !== peacockColor);
  });

  test('Workspace color is updated when in Remote Containers context.', async () => {
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.devContainer);
    const qpStub = await stubQuickPick(azureBlueResponse);
    await executeCommand(Commands.changeColorToFavorite);
    qpStub.restore();
    remoteNameStub.restore();

    let config = getPeacockWorkspaceColorCustomizationConfig();
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

    let config = getPeacockWorkspaceColorCustomizationConfig();
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

    let config = getPeacockWorkspaceColorCustomizationConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    assert(isValidColorInput(value));
    assert(value === azureBlue);
  });

  test('Workspace color is reverted when not in a remote context.', async () => {
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(undefined);
    await executeCommand<vscode.ExtensionContext>(Commands.changeColorToPeacockGreen);
    remoteNameStub.restore();

    let config = getPeacockWorkspaceColorCustomizationConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    // we should be back to green
    assert.ok(isValidColorInput(value));
    assert.ok(value !== azureBlue);
    assert.equal(value, peacockGreen);
  });
});

const stubQuickPick = async (fakeResponse: string) =>
  await sinon.stub(vscode.window, 'showQuickPick').returns(Promise.resolve<any>(fakeResponse));
