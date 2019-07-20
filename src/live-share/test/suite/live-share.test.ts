import vscode = require('vscode');
import sinon = require('sinon');
import assert = require('assert');
import * as vsls from 'vsls';

import { IPeacockSettings, Commands, ColorSettings } from '../../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from '../../../test/suite/lib/setup-teardown-test-suite';
import { isValidColorInput } from '../../../color-library';
import { executeCommand } from '../../../test/suite/lib/constants';
import { LiveShareCommands } from '../../enums';
import { peacockVslsMementos } from '../../constants';
import { getPeacockWorkspaceConfig } from '../../../configuration';

const sleepAsync = (delay: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
};

suite('Live Share Integration', () => {
  let originalValues = <IPeacockSettings>{};

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  test('can set color setting for Live Share host', async () => {
    // Stub the async quick pick to return a response
    const color = '#007fff';
    const fakeResponse = `Azure Blue -> ${color}`;
    const stub = await sinon.stub(vscode.window, 'showQuickPick').returns(Promise.resolve<any>(fakeResponse));

    const extensionContext = await executeCommand<vscode.ExtensionContext>(
      LiveShareCommands.changeColorOfLiveShareHost,
    );

    const settingValue = (await extensionContext!.globalState.get<string>(peacockVslsMementos.vslsShareColor)) || '';
    await extensionContext!.globalState.update(peacockVslsMementos.vslsShareColor, null);

    stub.restore();

    assert(isValidColorInput(settingValue));
    assert(settingValue === color);
  });

  test('can set color setting for Live Share guest', async () => {
    // Stub the async quick pick to return a response
    const color = '#007fff';
    const fakeResponse = `Azure Blue -> ${color}`;
    const stub = await sinon.stub(vscode.window, 'showQuickPick').returns(Promise.resolve<any>(fakeResponse));

    const extensionContext = await executeCommand<vscode.ExtensionContext>(
      LiveShareCommands.changeColorOfLiveShareGuest,
    );

    const settingValue = (await extensionContext!.globalState.get<string>(peacockVslsMementos.vslsJoinColor)) || '';
    await extensionContext!.globalState.update(peacockVslsMementos.vslsJoinColor, null);

    stub.restore();

    assert(isValidColorInput(settingValue));
    assert(settingValue === color);
  });

  test('Workspace color is updated when Live Share session is started.', async () => {
    const vslsApi = await vsls.getApi();

    if (!vslsApi) {
      throw new Error('Live Share extension is not installed.');
    }

    const color = '#007fff';
    const fakeResponse = `Azure Blue -> ${color}`;
    const stub = await sinon.stub(vscode.window, 'showQuickPick').returns(Promise.resolve<any>(fakeResponse));

    const extensionContext = await executeCommand<vscode.ExtensionContext>(
      LiveShareCommands.changeColorOfLiveShareHost,
    );
    stub.restore();

    await vslsApi.share();
    await sleepAsync(1000);

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    await vslsApi.end();
    await extensionContext!.globalState.update(peacockVslsMementos.vslsShareColor, null);

    assert(isValidColorInput(value));
    assert(value === color);
  });

  test('Workspace color is reverted when Live Share session is ended.', async () => {
    const vslsApi = await vsls.getApi();

    if (!vslsApi) {
      throw new Error('Live Share extension is not installed.');
    }

    const color = '#007fff';
    const fakeResponse = `Azure Blue -> ${color}`;
    const stub = await sinon.stub(vscode.window, 'showQuickPick').returns(Promise.resolve<any>(fakeResponse));

    const extensionContext = await executeCommand<vscode.ExtensionContext>(
      LiveShareCommands.changeColorOfLiveShareHost,
    );
    stub.restore();

    await vslsApi.share();
    await sleepAsync(1000);
    await vslsApi.end();
    await sleepAsync(1000);

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    await extensionContext!.globalState.update(peacockVslsMementos.vslsShareColor, null);

    assert(!isValidColorInput(value));
    assert(value == null);
  });

  test('Workspace color is immediately reflected when set during Live Share session.', async () => {
    const vslsApi = await vsls.getApi();

    if (!vslsApi) {
      throw new Error('Live Share extension is not installed.');
    }

    await vslsApi.share();

    const color = '#007fff';
    const fakeResponse = `Azure Blue -> ${color}`;
    const stub = await sinon.stub(vscode.window, 'showQuickPick').returns(Promise.resolve<any>(fakeResponse));

    const extensionContext = await executeCommand<vscode.ExtensionContext>(
      LiveShareCommands.changeColorOfLiveShareHost,
    );
    stub.restore();

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    await vslsApi.end();
    await extensionContext!.globalState.update(peacockVslsMementos.vslsShareColor, null);

    assert(isValidColorInput(value));
    assert(value === color);
  });

  test('Workspace color is immediately reflected when updated during Live Share session.', async () => {
    const vslsApi = await vsls.getApi();

    if (!vslsApi) {
      throw new Error('Live Share extension is not installed.');
    }

    const color = '#007fff';
    const fakeResponse = `Azure Blue -> ${color}`;
    const stub = await sinon.stub(vscode.window, 'showQuickPick').returns(Promise.resolve<any>(fakeResponse));

    const extensionContext = await executeCommand<vscode.ExtensionContext>(
      LiveShareCommands.changeColorOfLiveShareHost,
    );
    stub.restore();

    await vslsApi.share();

    await sleepAsync(1000);

    const color2 = '#68217a';
    const fakeResponse2 = `C# Purple -> ${color2}`;
    const stub2 = await sinon.stub(vscode.window, 'showQuickPick').returns(Promise.resolve<any>(fakeResponse2));

    await executeCommand<vscode.ExtensionContext>(LiveShareCommands.changeColorOfLiveShareHost);
    stub2.restore();

    await sleepAsync(1000);

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground] as string;

    assert(isValidColorInput(value));
    assert(value === color2);

    await vslsApi.end();
    await extensionContext!.globalState.update(peacockVslsMementos.vslsShareColor, null);
  });

  test('Workspace color is reverted after Live Share session when updated the color multiple times.', async () => {
    const vslsApi = await vsls.getApi();

    if (!vslsApi) {
      throw new Error('Live Share extension is not installed.');
    }

    await vslsApi.share();

    await sleepAsync(1000);

    const color2 = '#68217a';
    const fakeResponse2 = `C# Purple -> ${color2}`;
    const stub2 = await sinon.stub(vscode.window, 'showQuickPick').returns(Promise.resolve<any>(fakeResponse2));

    const extensionContext = await executeCommand<vscode.ExtensionContext>(
      LiveShareCommands.changeColorOfLiveShareHost,
    );
    stub2.restore();

    await sleepAsync(1000);

    const color3 = '#b52e31';
    const fakeResponse3 = `Abgular Red -> ${color3}`;
    const stub3 = await sinon.stub(vscode.window, 'showQuickPick').returns(Promise.resolve<any>(fakeResponse3));

    await executeCommand<vscode.ExtensionContext>(LiveShareCommands.changeColorOfLiveShareHost);
    stub3.restore();

    await sleepAsync(1000);

    const color4 = '#639';
    const fakeResponse4 = `Gatsby Purple -> ${color4}`;
    const stub4 = await sinon.stub(vscode.window, 'showQuickPick').returns(Promise.resolve<any>(fakeResponse4));

    await executeCommand<vscode.ExtensionContext>(LiveShareCommands.changeColorOfLiveShareHost);
    stub4.restore();

    await sleepAsync(1000);

    await vslsApi.end();

    await sleepAsync(1000);

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground] as string;

    assert(!isValidColorInput(value));
    assert(value == null);

    await extensionContext!.globalState.update(peacockVslsMementos.vslsShareColor, null);
  });

  test('Workspace color is reverted to a preset color after Live Share session when updated the color multiple times.', async () => {
    const vslsApi = await vsls.getApi();

    if (!vslsApi) {
      throw new Error('Live Share extension is not installed.');
    }

    const startColor = '#007fff';
    const fakeResponse = `Azure Blue -> ${startColor}`;
    const stub = await sinon.stub(vscode.window, 'showQuickPick').returns(Promise.resolve<any>(fakeResponse));

    await executeCommand(Commands.changeColorToFavorite);
    stub.restore();

    await vslsApi.share();

    await sleepAsync(1000);

    const color2 = '#68217a';
    const fakeResponse2 = `C# Purple -> ${color2}`;
    const stub2 = await sinon.stub(vscode.window, 'showQuickPick').returns(Promise.resolve<any>(fakeResponse2));

    const extensionContext = await executeCommand<vscode.ExtensionContext>(
      LiveShareCommands.changeColorOfLiveShareHost,
    );
    stub2.restore();

    await sleepAsync(1000);

    const color3 = '#b52e31';
    const fakeResponse3 = `Abgular Red -> ${color3}`;
    const stub3 = await sinon.stub(vscode.window, 'showQuickPick').returns(Promise.resolve<any>(fakeResponse3));

    await executeCommand<vscode.ExtensionContext>(LiveShareCommands.changeColorOfLiveShareHost);
    stub3.restore();

    await sleepAsync(1000);

    const color4 = '#639';
    const fakeResponse4 = `Gatsby Purple -> ${color4}`;
    const stub4 = await sinon.stub(vscode.window, 'showQuickPick').returns(Promise.resolve<any>(fakeResponse4));

    await executeCommand<vscode.ExtensionContext>(LiveShareCommands.changeColorOfLiveShareHost);
    stub4.restore();

    await sleepAsync(1000);

    await vslsApi.end();

    await sleepAsync(1000);

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground] as string;

    assert(isValidColorInput(value));
    assert(value === startColor);

    await extensionContext!.globalState.update(peacockVslsMementos.vslsShareColor, null);
  });
});
