import vscode = require('vscode');
import sinon = require('sinon');
import assert = require('assert');

import { IPeacockSettings, ColorSettings } from '../../models';
import { allSetupAndTeardown } from '../../test/lib/setup-teardown-test-suite';
import { isValidColorInput } from '../../color-library';
import { executeCommand } from '../../test/lib/constants';

import { getPeacockWorkspaceConfig } from '../../configuration';
import {
  remoteContainersColorMementoName,
  remoteSshColorMementoName,
  remoteWslColorMementoName
} from '../constants';
import { RemoteCommands, RemoteNames } from '../enums';

suite('Remote Integration', () => {
  let originalValues = <IPeacockSettings>{};
  allSetupAndTeardown(originalValues);

  test('can set color setting for Remote WSL', async () => {
    // Stub the async quick pick to return a response
    const color = '#007fff';
    const fakeResponse = `Azure Blue -> ${color}`;
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    const extensionContext = await executeCommand<vscode.ExtensionContext>(
      RemoteCommands.changeColorOfRemoteWsl
    );

    const settingValue =
      (await extensionContext!.globalState.get<string>(
        remoteWslColorMementoName
      )) || '';
    await extensionContext!.globalState.update(remoteWslColorMementoName, null);

    stub.restore();

    assert(isValidColorInput(settingValue));
    assert(settingValue === color);
  });

  test('can set color setting for Remote SSH', async () => {
    // Stub the async quick pick to return a response
    const color = '#007fff';
    const fakeResponse = `Azure Blue -> ${color}`;
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    const extensionContext = await executeCommand<vscode.ExtensionContext>(
      RemoteCommands.changeColorOfRemoteSsh
    );

    const settingValue =
      (await extensionContext!.globalState.get<string>(
        remoteSshColorMementoName
      )) || '';
    await extensionContext!.globalState.update(remoteSshColorMementoName, null);

    stub.restore();

    assert(isValidColorInput(settingValue));
    assert(settingValue === color);
  });

  test('can set color setting for Remote Containers', async () => {
    // Stub the async quick pick to return a response
    const color = '#007fff';
    const fakeResponse = `Azure Blue -> ${color}`;
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    const extensionContext = await executeCommand<vscode.ExtensionContext>(
      RemoteCommands.changeColorOfRemoteContainers
    );

    const settingValue =
      (await extensionContext!.globalState.get<string>(
        remoteContainersColorMementoName
      )) || '';
    await extensionContext!.globalState.update(
      remoteContainersColorMementoName,
      null
    );

    stub.restore();

    assert(isValidColorInput(settingValue));
    assert(settingValue === color);
  });

  test('Workspace color is updated when in Remote Containers context.', async () => {
    const getRemoteNameStub = sinon
      .stub(vscode.env, 'remoteName')
      .value(RemoteNames.devContainer);

    const color = '#007fff';
    const fakeResponse = `Azure Blue -> ${color}`;
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
      remoteContainersColorMementoName,
      null
    );

    assert(isValidColorInput(value));
    assert(value === color);
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
      remoteContainersColorMementoName,
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
      remoteContainersColorMementoName,
      null
    );

    assert(isValidColorInput(value));
    assert(value === color);
  });

  test('Workspace color is reverted when not in a remote context.', async () => {
    const remoteNameStub = sinon
      .stub(vscode.env, 'remoteName')
      .value(undefined);

    const color = '#007fff';
    const fakeResponse = `Azure Blue -> ${color}`;
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
      remoteContainersColorMementoName,
      null
    );

    assert(!isValidColorInput(value));
    assert(value == null);
  });
});
