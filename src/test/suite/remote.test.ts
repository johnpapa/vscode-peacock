import vscode = require('vscode');
import sinon = require('sinon');
import assert = require('assert');

import {
  IPeacockSettings,
  ColorSettings,
  Commands,
  peacockGreen,
  azureBlue,
} from '../../models';
import {
  setupTestSuite,
  setupTest,
  teardownTestSuite,
} from './lib/setup-teardown-test-suite';
import { isValidColorInput } from '../../color-library';
import { executeCommand } from './lib/constants';

import {
  getPeacockWorkspaceConfig,
  getEnvironmentAwareColor,
} from '../../configuration';
import { RemoteNames } from '../../remote';

suite('Remote Integration', () => {
  let originalValues = <IPeacockSettings>{};
  const azureBlueResponse = `Azure Blue -> ${azureBlue}`;
  const peacockGreenResponse = `Peacock Green -> ${peacockGreen}`;

  suiteSetup(
    async () => await setupTestSuite(originalValues),
  );
  suiteTeardown(
    async () => await teardownTestSuite(originalValues),
  );
  setup(async () => await setupTest());

  test('when setting remote, remote color is different than regular color', async () => {
    // Set to green
    const qpStub1 = await stubQuickPick(
      peacockGreenResponse,
    );
    await executeCommand(Commands.changeColorToFavorite);
    const peacockColor = getEnvironmentAwareColor();
    qpStub1.restore();

    // GO to remote env and set to blue
    const remoteNameStub = sinon
      .stub(vscode.env, 'remoteName')
      .value(RemoteNames.wsl);
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
    const remoteNameStub = sinon
      .stub(vscode.env, 'remoteName')
      .value(RemoteNames.wsl);
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
    const remoteNameStub = sinon
      .stub(vscode.env, 'remoteName')
      .value(RemoteNames.sshRemote);
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
    const remoteNameStub = sinon
      .stub(vscode.env, 'remoteName')
      .value(RemoteNames.devContainer);
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
    const remoteNameStub = sinon
      .stub(vscode.env, 'remoteName')
      .value(RemoteNames.devContainer);
    const qpStub = await stubQuickPick(azureBlueResponse);
    await executeCommand(Commands.changeColorToFavorite);
    qpStub.restore();
    remoteNameStub.restore();

    let config = getPeacockWorkspaceConfig();
    const value =
      config[ColorSettings.titleBar_activeBackground];

    assert.ok(isValidColorInput(value));
    assert.equal(value, azureBlue);
  });

  test('Workspace color is updated when in Remote WSL context.', async () => {
    const remoteNameStub = sinon
      .stub(vscode.env, 'remoteName')
      .value(RemoteNames.wsl);
    const qpStub = await stubQuickPick(azureBlueResponse);
    await executeCommand(Commands.changeColorToFavorite);
    qpStub.restore();
    remoteNameStub.restore();

    let config = getPeacockWorkspaceConfig();
    const value =
      config[ColorSettings.titleBar_activeBackground];

    assert(isValidColorInput(value));
    assert(value === azureBlue);
  });

  test('Workspace color is updated when in Remote SSH context.', async () => {
    const remoteNameStub = sinon
      .stub(vscode.env, 'remoteName')
      .value(RemoteNames.sshRemote);
    const qpStub = await stubQuickPick(azureBlueResponse);
    await executeCommand(Commands.changeColorToFavorite);
    qpStub.restore();
    remoteNameStub.restore();

    let config = getPeacockWorkspaceConfig();
    const value =
      config[ColorSettings.titleBar_activeBackground];

    assert(isValidColorInput(value));
    assert(value === azureBlue);
  });

  test('Workspace color is reverted when not in a remote context.', async () => {
    const remoteNameStub = sinon
      .stub(vscode.env, 'remoteName')
      .value(undefined);
    await executeCommand<vscode.ExtensionContext>(
      Commands.changeColorToPeacockGreen,
    );
    remoteNameStub.restore();

    let config = getPeacockWorkspaceConfig();
    const value =
      config[ColorSettings.titleBar_activeBackground];

    // we should be back to green
    assert.ok(isValidColorInput(value));
    assert.ok(value !== azureBlue);
    assert.equal(value, peacockGreen);
  });
});

const stubQuickPick = async (fakeResponse: string) =>
  await sinon
    .stub(vscode.window, 'showQuickPick')
    .returns(Promise.resolve<any>(fakeResponse));
