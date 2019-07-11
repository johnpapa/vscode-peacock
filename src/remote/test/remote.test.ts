import vscode = require('vscode');
import sinon = require('sinon');
import assert = require('assert');

import {
  IPeacockSettings,
  ColorSettings,
  Commands,
  peacockGreen,
  azureBlue
} from '../../models';
import {
  setupTestSuite,
  setupTest,
  teardownTestSuite
} from '../../test/lib/setup-teardown-test-suite';
import { isValidColorInput } from '../../color-library';
import { executeCommand } from '../../test/lib/constants';

import { getPeacockWorkspaceConfig } from '../../configuration';
import { peacockRemoteMementos } from '../constants';
import { RemoteCommands, RemoteNames } from '../enums';

suite('Remote Integration', () => {
  let originalValues = <IPeacockSettings>{};

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  setup(async () => {
    // Start with green
    await executeCommand(Commands.changeColorToPeacockGreen);
  });

  test('can set color setting for Remote WSL', async () => {
    // Stub the async quick pick to return a response
    // change to blue
    const fakeResponse = `Azure Blue -> ${azureBlue}`;
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    const extensionContext = await executeCommand<vscode.ExtensionContext>(
      RemoteCommands.changeColorOfRemoteWsl
    );

    const settingValue =
      (await extensionContext!.globalState.get<string>(
        peacockRemoteMementos.remoteWslColor
      )) || '';
    await extensionContext!.globalState.update(
      peacockRemoteMementos.remoteWslColor,
      null
    );

    stub.restore();

    assert(isValidColorInput(settingValue));
    assert(settingValue === azureBlue);
  });

  test('can set color setting for Remote SSH', async () => {
    // Stub the async quick pick to return a response
    // change to blue
    const fakeResponse = `Azure Blue -> ${azureBlue}`;
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    const extensionContext = await executeCommand<vscode.ExtensionContext>(
      RemoteCommands.changeColorOfRemoteSsh
    );

    const settingValue =
      (await extensionContext!.globalState.get<string>(
        peacockRemoteMementos.remoteSshColor
      )) || '';
    await extensionContext!.globalState.update(
      peacockRemoteMementos.remoteSshColor,
      null
    );

    stub.restore();

    assert(isValidColorInput(settingValue));
    assert(settingValue === azureBlue);
  });

  test('can set color setting for Remote Containers', async () => {
    // Stub the async quick pick to return a response
    // change to blue
    const fakeResponse = `Azure Blue -> ${azureBlue}`;
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    const extensionContext = await executeCommand<vscode.ExtensionContext>(
      RemoteCommands.changeColorOfRemoteContainers
    );

    const settingValue =
      (await extensionContext!.globalState.get<string>(
        peacockRemoteMementos.remoteContainersColor
      )) || '';
    await extensionContext!.globalState.update(
      peacockRemoteMementos.remoteContainersColor,
      null
    );

    stub.restore();

    assert(isValidColorInput(settingValue));
    assert(settingValue === azureBlue);
  });

  test('Workspace color is updated when in Remote Containers context.', async () => {
    const getRemoteNameStub = sinon
      .stub(vscode.env, 'remoteName')
      .value(RemoteNames.devContainer);

    // change to blue
    const fakeResponse = `Azure Blue -> ${azureBlue}`;
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    const extensionContext = await executeCommand<vscode.ExtensionContext>(
      RemoteCommands.changeColorOfRemoteContainers
    );
    stub.restore();
    getRemoteNameStub.restore();

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    await extensionContext!.globalState.update(
      peacockRemoteMementos.remoteContainersColor,
      null
    );

    assert(isValidColorInput(value));
    assert(value === azureBlue);
  });

  test('Workspace color is updated when in Remote WSL context.', async () => {
    const getRemoteNameStub = sinon.stub(vscode.env, 'remoteName').value('wsl');

    const color = '#007fff';
    const fakeResponse = `Azure Blue -> ${color}`;
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    const extensionContext = await executeCommand<vscode.ExtensionContext>(
      RemoteCommands.changeColorOfRemoteWsl
    );
    stub.restore();
    getRemoteNameStub.restore();

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    await extensionContext!.globalState.update(
      peacockRemoteMementos.remoteContainersColor,
      null
    );

    assert(isValidColorInput(value));
    assert(value === color);
  });

  test('Workspace color is updated when in Remote SSH context.', async () => {
    const remoteName = sinon.stub(vscode.env, 'remoteName').value('ssh-remote');

    const color = '#007fff';
    const fakeResponse = `Azure Blue -> ${color}`;
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    const extensionContext = await executeCommand<vscode.ExtensionContext>(
      RemoteCommands.changeColorOfRemoteSsh
    );
    stub.restore();
    remoteName.restore();

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    await extensionContext!.globalState.update(
      peacockRemoteMementos.remoteContainersColor,
      null
    );

    assert(isValidColorInput(value));
    assert(value === color);
  });

  test('Workspace color is reverted when not in a remote context.', async () => {
    const remoteNameStub = sinon
      .stub(vscode.env, 'remoteName')
      .value(undefined);

    // change to blue
    const fakeResponse = `Azure Blue -> ${azureBlue}`;
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    const extensionContext = await executeCommand<vscode.ExtensionContext>(
      RemoteCommands.changeColorOfRemoteContainers
    );
    stub.restore();
    remoteNameStub.restore();

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    await extensionContext!.globalState.update(
      peacockRemoteMementos.remoteContainersColor,
      null
    );

    // we should be back to green
    assert(isValidColorInput(value));
    assert(value !== azureBlue);
    assert(value === peacockGreen);
  });
});
