import vscode = require('vscode');
import sinon = require('sinon');
import assert = require('assert');

import { IPeacockSettings, ColorSettings, Commands, peacockGreen, azureBlue } from '../../models';
import { setupTestSuite, setupTest, teardownTestSuite } from './lib/setup-teardown-test-suite';
import { isValidColorInput } from '../../color-library';
import { executeCommand } from './lib/constants';

import { getPeacockWorkspaceConfig } from '../../configuration';
import { peacockRemoteMementos } from '../../remote/constants';
import { RemoteCommands, RemoteNames } from '../../remote/enums';

suite('Remote Integration', () => {
  let originalValues = <IPeacockSettings>{};
  let stubQuickPick: any;
  let extensionContext: vscode.ExtensionContext | undefined;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  setup(async () => {
    // Start with green
    extensionContext = await executeCommand<vscode.ExtensionContext>(
      Commands.changeColorToPeacockGreen,
    );

    // Stub the async quick pick to return a response
    // change to blue
    const fakeResponse = `Azure Blue -> ${azureBlue}`;
    stubQuickPick = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));
  });
  teardown(async () => {
    stubQuickPick!.restore();
  });

  test('can set color setting for Remote WSL', async () => {
    await executeCommand<vscode.ExtensionContext>(RemoteCommands.changeColorOfRemoteWsl);

    const settingValue = extensionContext!.globalState.get<string>(
      peacockRemoteMementos.remoteWslColor,
      '',
    );

    console.log('settingValue');
    console.log(settingValue);
    assert(settingValue === azureBlue);
  });

  test('can set color setting for Remote SSH', async () => {
    await executeCommand<vscode.ExtensionContext>(RemoteCommands.changeColorOfRemoteSsh);

    const settingValue = extensionContext!.globalState.get<string>(
      peacockRemoteMementos.remoteSshColor,
      '',
    );

    assert(isValidColorInput(settingValue));
    assert(settingValue === azureBlue);
  });

  test('can set color setting for Remote Containers', async () => {
    await executeCommand<vscode.ExtensionContext>(RemoteCommands.changeColorOfRemoteContainers);

    const settingValue = extensionContext!.globalState.get<string>(
      peacockRemoteMementos.remoteContainersColor,
      '',
    );

    assert(isValidColorInput(settingValue));
    assert(settingValue === azureBlue);
  });

  test('Workspace color is updated when in Remote Containers context.', async () => {
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.devContainer);

    await executeCommand<vscode.ExtensionContext>(RemoteCommands.changeColorOfRemoteContainers);

    remoteNameStub.restore();

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    assert(isValidColorInput(value));
    assert(value === azureBlue);
  });

  test('Workspace color is updated when in Remote WSL context.', async () => {
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.wsl);

    await executeCommand<vscode.ExtensionContext>(RemoteCommands.changeColorOfRemoteWsl);

    remoteNameStub.restore();

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    assert(isValidColorInput(value));
    assert(value === azureBlue);
  });

  test('Workspace color is updated when in Remote SSH context.', async () => {
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(RemoteNames.sshRemote);

    await executeCommand<vscode.ExtensionContext>(RemoteCommands.changeColorOfRemoteSsh);

    remoteNameStub.restore();

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    assert(isValidColorInput(value));
    assert(value === azureBlue);
  });

  test('Workspace color is reverted when not in a remote context.', async () => {
    const remoteNameStub = sinon.stub(vscode.env, 'remoteName').value(undefined);

    await executeCommand<vscode.ExtensionContext>(RemoteCommands.changeColorOfRemoteContainers);

    remoteNameStub.restore();

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    // we should be back to green
    assert(isValidColorInput(value));
    assert(value !== azureBlue);
    assert(value === peacockGreen);
  });
});
