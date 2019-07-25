import vscode = require('vscode');
import sinon = require('sinon');
import assert = require('assert');
import * as vsls from 'vsls';

import { IPeacockSettings, Commands, ColorSettings, timeout } from '../../../models';
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
  updateLiveShareColor,
  getLiveShareColor,
} from '../../../configuration';

suite('Live Share Integration', () => {
  let originalValues = <IPeacockSettings>{};

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  test('can set color setting for Live Share host', async () => {
    // Stub the async quick pick to return a response
    const color = '#007fff';
    const fakeResponse = `Azure Blue -> ${color}`;
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));
    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    const settingValue = getLiveShareColor(LiveShareSettings.VSLSShareColor) || '';
    await updateLiveShareColor(LiveShareSettings.VSLSShareColor, '');
    stub.restore();

    assert(isValidColorInput(settingValue));
    assert(settingValue === color);
  });

  test('can set color setting for Live Share guest', async () => {
    // Stub the async quick pick to return a response
    const color = '#007fff';
    const fakeResponse = `Azure Blue -> ${color}`;
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));
    await executeCommand(LiveShareCommands.changeColorOfLiveShareGuest);
    const settingValue = getLiveShareColor(LiveShareSettings.VSLSJoinColor) || '';
    await updateLiveShareColor(LiveShareSettings.VSLSJoinColor, '');
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
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));
    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub.restore();

    await vslsApi.share();
    await timeout(1000);

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    await vslsApi.end();
    await updateLiveShareColor(LiveShareSettings.VSLSShareColor, '');

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
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub.restore();

    await vslsApi.share();
    await timeout(1000);
    await vslsApi.end();
    await timeout(1000);

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    await updateLiveShareColor(LiveShareSettings.VSLSShareColor, '');

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
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub.restore();

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    await vslsApi.end();
    await updateLiveShareColor(LiveShareSettings.VSLSShareColor, '');

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
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub.restore();

    await vslsApi.share();

    await timeout(1000);

    const color2 = '#68217a';
    const fakeResponse2 = `C# Purple -> ${color2}`;
    const stub2 = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse2));

    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub2.restore();

    await timeout(1000);

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground] as string;

    assert(isValidColorInput(value));
    assert(value === color2);

    await vslsApi.end();
    await updateLiveShareColor(LiveShareSettings.VSLSShareColor, '');
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
    const stub2 = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse2));

    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub2.restore();

    await timeout(1000);

    const color3 = '#b52e31';
    const fakeResponse3 = `Angular Red -> ${color3}`;
    const stub3 = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse3));

    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub3.restore();

    await timeout(1000);

    const color4 = '#639';
    const fakeResponse4 = `Gatsby Purple -> ${color4}`;
    const stub4 = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse4));

    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub4.restore();

    await timeout(1000);

    await vslsApi.end();

    await timeout(1000);

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground] as string;

    assert(!isValidColorInput(value));
    assert(value == null);

    await updateLiveShareColor(LiveShareSettings.VSLSShareColor, '');
  });

  test('Workspace color is reverted to a preset color after Live Share session when updated the color multiple times.', async () => {
    const vslsApi = await vsls.getApi();

    if (!vslsApi) {
      throw new Error('Live Share extension is not installed.');
    }

    const startColor = '#007fff';
    const fakeResponse = `Azure Blue -> ${startColor}`;
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    await executeCommand(Commands.changeColorToFavorite);
    stub.restore();

    await vslsApi.share();

    await timeout(1000);

    const color2 = '#68217a';
    const fakeResponse2 = `C# Purple -> ${color2}`;
    const stub2 = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse2));

    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub2.restore();

    await timeout(1000);

    const color3 = '#b52e31';
    const fakeResponse3 = `Angular Red -> ${color3}`;
    const stub3 = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse3));

    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub3.restore();

    await timeout(1000);

    const color4 = '#639';
    const fakeResponse4 = `Gatsby Purple -> ${color4}`;
    const stub4 = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse4));

    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub4.restore();

    await timeout(1000);

    await vslsApi.end();

    await timeout(1000);

    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground] as string;

    assert(isValidColorInput(value));
    assert(value === startColor);

    await updateLiveShareColor(LiveShareSettings.VSLSShareColor, '');
  });
});

const stubQuickPick = async (fakeResponse: string) =>
  await sinon.stub(vscode.window, 'showQuickPick').returns(Promise.resolve<any>(fakeResponse));
