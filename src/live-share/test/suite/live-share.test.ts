import vscode = require('vscode');
import sinon = require('sinon');
import assert = require('assert');
import * as vsls from 'vsls';

import { IPeacockSettings, Commands, ColorSettings, timeout, azureBlue } from '../../../models';
import {
  setupTestSuite,
  teardownTestSuite,
  setupTest,
} from '../../../test/suite/lib/setup-teardown-test-suite';
import { isValidColorInput } from '../../../color-library';
import { executeCommand } from '../../../test/suite/lib/constants';
import { LiveShareCommands, LiveShareSettings } from '../../enums';
import {
  getPeacockWorkspaceConfig,
  getLiveShareColor,
  updateLiveShareColor,
} from '../../../configuration';

suite('Live Share Integration', () => {
  let originalValues = <IPeacockSettings>{};
  let extensionContext: vscode.ExtensionContext | undefined;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  setup(async () => {
    extensionContext = await executeCommand<vscode.ExtensionContext>(
      LiveShareCommands.changeColorOfLiveShareHost,
    );
  });

  teardown(async () => {
    await updateLiveShareColor(LiveShareSettings.VSLSShareColor, '');
  });

  test('can set color setting for Live Share host', async () => {
    // Stub the async quick pick to return a response
    const fakeResponse = `Azure Blue -> ${azureBlue}`;
    const stub = await stubQickPick(fakeResponse);

    const settingValue = getLiveShareColor(LiveShareSettings.VSLSShareColor) || '';

    stub.restore();

    assert(isValidColorInput(settingValue));
    assert(settingValue === azureBlue);
  });

  test('can set color setting for Live Share guest', async () => {
    // Stub the async quick pick to return a response
    const fakeResponse = `Azure Blue -> ${azureBlue}`;
    const stub = await stubQickPick(fakeResponse);

    const settingValue = getLiveShareColor(LiveShareSettings.VSLSJoinColor) || '';
    await updateLiveShareColor(LiveShareSettings.VSLSJoinColor, '');

    stub.restore();

    assert(isValidColorInput(settingValue));
    assert(settingValue === azureBlue);
  });

  test('Workspace color is updated when Live Share session is started.', async () => {
    const vslsApi = await vsls.getApi();

    if (!vslsApi) {
      throw new Error('Live Share extension is not installed.');
    }

    const fakeResponse = `Azure Blue -> ${azureBlue}`;
    const stub = await stubQickPick(fakeResponse);

    stub.restore();

    await vslsApi.share();
    await timeout(1000);

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    await vslsApi.end();

    assert(isValidColorInput(value));
    assert(value === azureBlue);
  });

  test('Workspace color is reverted when Live Share session is ended.', async () => {
    const vslsApi = await vsls.getApi();

    if (!vslsApi) {
      throw new Error('Live Share extension is not installed.');
    }

    const fakeResponse = `Azure Blue -> ${azureBlue}`;
    const stub = await stubQickPick(fakeResponse);

    stub.restore();

    await vslsApi.share();
    await timeout(1000);
    await vslsApi.end();
    await timeout(1000);

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    // await updateLiveShareColor(LiveShareSettings.VSLSShareColor, '');

    assert(!isValidColorInput(value));
    assert(value == null);
  });

  test('Workspace color is immediately reflected when set during Live Share session.', async () => {
    const vslsApi = await vsls.getApi();

    if (!vslsApi) {
      throw new Error('Live Share extension is not installed.');
    }

    await vslsApi.share();

    const fakeResponse = `Azure Blue -> ${azureBlue}`;
    const stub = await stubQickPick(fakeResponse);

    stub.restore();

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    await vslsApi.end();

    assert(isValidColorInput(value));
    assert(value === azureBlue);
  });

  test('Workspace color is immediately reflected when updated during Live Share session.', async () => {
    const vslsApi = await vsls.getApi();

    if (!vslsApi) {
      throw new Error('Live Share extension is not installed.');
    }
    const fakeResponse = `Azure Blue -> ${azureBlue}`;
    const stub = await stubQickPick(fakeResponse);

    stub.restore();

    await vslsApi.share();

    await timeout(1000);

    const color2 = '#68217a';
    const fakeResponse2 = `C# Purple -> ${color2}`;
    const stub2 = await stubQickPick(fakeResponse2);

    await executeCommand<vscode.ExtensionContext>(LiveShareCommands.changeColorOfLiveShareHost);
    stub2.restore();

    await timeout(1000);

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground] as string;

    assert(isValidColorInput(value));
    assert(value === color2);

    await vslsApi.end();
    // await updateLiveShareColor(LiveShareSettings.VSLSShareColor, '');
  });

  test('Workspace color is reverted after Live Share session when updated the color multiple times.', async () => {
    const vslsApi = await vsls.getApi();

    if (!vslsApi) {
      throw new Error('Live Share extension is not installed.');
    }

    await vslsApi.share();

    await timeout(1000);

    const color2 = '#68217a';
    const fakeResponse2 = `C# Purple -> ${color2}`;
    const stub2 = await stubQickPick(fakeResponse2);

    stub2.restore();

    await timeout(1000);

    const color3 = '#b52e31';
    const fakeResponse3 = `Angular Red -> ${color3}`;
    const stub3 = await stubQickPick(fakeResponse3);

    await executeCommand<vscode.ExtensionContext>(LiveShareCommands.changeColorOfLiveShareHost);
    stub3.restore();

    await timeout(1000);

    const color4 = '#639';
    const fakeResponse4 = `Gatsby Purple -> ${color4}`;
    const stub4 = await stubQickPick(fakeResponse4);

    await executeCommand<vscode.ExtensionContext>(LiveShareCommands.changeColorOfLiveShareHost);
    stub4.restore();

    await timeout(1000);

    await vslsApi.end();

    await timeout(1000);

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground] as string;

    assert(!isValidColorInput(value));
    assert(value == null);

    // await updateLiveShareColor(LiveShareSettings.VSLSShareColor, '');
  });

  test('Workspace color is reverted to a preset color after Live Share session when updated the color multiple times.', async () => {
    const vslsApi = await vsls.getApi();

    if (!vslsApi) {
      throw new Error('Live Share extension is not installed.');
    }

    const startColor = azureBlue;
    const fakeResponse = `Azure Blue -> ${startColor}`;
    const stub = await stubQickPick(fakeResponse);

    await executeCommand(Commands.changeColorToFavorite);
    stub.restore();

    await vslsApi.share();

    await timeout(1000);

    const color2 = '#68217a';
    const fakeResponse2 = `C# Purple -> ${color2}`;
    const stub2 = await stubQickPick(fakeResponse2);

    stub2.restore();

    await timeout(1000);

    const color3 = '#b52e31';
    const fakeResponse3 = `Abgular Red -> ${color3}`;
    const stub3 = await stubQickPick(fakeResponse3);

    await executeCommand<vscode.ExtensionContext>(LiveShareCommands.changeColorOfLiveShareHost);
    stub3.restore();

    await timeout(1000);

    const color4 = '#639';
    const fakeResponse4 = `Gatsby Purple -> ${color4}`;
    const stub4 = await stubQickPick(fakeResponse4);

    await executeCommand<vscode.ExtensionContext>(LiveShareCommands.changeColorOfLiveShareHost);
    stub4.restore();

    await timeout(1000);

    await vslsApi.end();

    await timeout(1000);

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground] as string;

    assert(isValidColorInput(value));
    assert(value === startColor);

    // await updateLiveShareColor(LiveShareSettings.VSLSShareColor, '');
  });
});

const stubQickPick = async (fakeResponse: string) => {
  const stub = await sinon
    .stub(vscode.window, 'showQuickPick')
    .returns(Promise.resolve<any>(fakeResponse));
  return stub;
};
