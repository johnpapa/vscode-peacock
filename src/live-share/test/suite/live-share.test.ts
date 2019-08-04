import * as assert from 'assert';
import * as vsls from 'vsls';

import { IPeacockSettings, Commands, ColorSettings, timeout, azureBlue } from '../../../models';
import {
  setupTestSuite,
  teardownTestSuite,
  setupTest,
} from '../../../test/suite/lib/setup-teardown-test-suite';
import { isValidColorInput } from '../../../color-library';
import { executeCommand, stubQuickPick } from '../../../test/suite/lib/constants';
import { LiveShareCommands, LiveShareSettings } from '../../enums';
import {
  getColorCustomizationConfig,
  updateLiveShareColor,
  getLiveShareColor,
} from '../../../configuration';

suite('Live Share Integration', () => {
  let originalValues = <IPeacockSettings>{};

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  test('can set color setting for Live Share host', async () => {
    const fakeResponse = `Azure Blue -> ${azureBlue}`;
    const stub = await stubQuickPick(fakeResponse);
    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    const settingValue = getLiveShareColor(LiveShareSettings.VSLSShareColor) || '';
    await updateLiveShareColor(LiveShareSettings.VSLSShareColor, undefined);
    stub.restore();

    assert.ok(isValidColorInput(settingValue));
    assert.equal(settingValue, azureBlue);
  });

  test('can set color setting for Live Share guest', async () => {
    const fakeResponse = `Azure Blue -> ${azureBlue}`;
    const stub = await stubQuickPick(fakeResponse);
    await executeCommand(LiveShareCommands.changeColorOfLiveShareGuest);
    const settingValue = getLiveShareColor(LiveShareSettings.VSLSJoinColor) || '';
    await updateLiveShareColor(LiveShareSettings.VSLSJoinColor, undefined);
    stub.restore();

    assert.ok(isValidColorInput(settingValue));
    assert.equal(settingValue, azureBlue);
  });

  test('Workspace color is updated when Live Share session is started.', async () => {
    const vslsApi = await vsls.getApi();

    if (!vslsApi) {
      throw new Error('Live Share extension is not installed.');
    }

    const fakeResponse = `Azure Blue -> ${azureBlue}`;
    const stub = await stubQuickPick(fakeResponse);
    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub.restore();

    await vslsApi.share();
    await timeout(1000);

    let config = getColorCustomizationConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    await vslsApi.end();
    await updateLiveShareColor(LiveShareSettings.VSLSShareColor, undefined);

    assert.ok(isValidColorInput(value));
    assert.equal(value, azureBlue);
  });

  test('Workspace color is reverted when Live Share session is ended.', async () => {
    const vslsApi = await vsls.getApi();

    if (!vslsApi) {
      throw new Error('Live Share extension is not installed.');
    }

    const fakeResponse = `Azure Blue -> ${azureBlue}`;
    const stub = await stubQuickPick(fakeResponse);
    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub.restore();

    await vslsApi.share();
    await timeout(1000);
    await vslsApi.end();
    await timeout(1000);

    let config = getColorCustomizationConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    await updateLiveShareColor(LiveShareSettings.VSLSShareColor, undefined);

    assert.ok(!isValidColorInput(value));
    assert.ok(!value);
  });

  test('Workspace color is immediately reflected when set during Live Share session.', async () => {
    const vslsApi = await vsls.getApi();

    if (!vslsApi) {
      throw new Error('Live Share extension is not installed.');
    }

    await vslsApi.share();

    const fakeResponse = `Azure Blue -> ${azureBlue}`;
    const stub = await stubQuickPick(fakeResponse);
    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub.restore();

    let config = getColorCustomizationConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    await vslsApi.end();
    await updateLiveShareColor(LiveShareSettings.VSLSShareColor, undefined);

    assert.ok(isValidColorInput(value));
    assert.equal(value, azureBlue);
  });

  test('Workspace color is immediately reflected when updated during Live Share session.', async () => {
    const vslsApi = await vsls.getApi();

    if (!vslsApi) {
      throw new Error('Live Share extension is not installed.');
    }

    const fakeResponse = `Azure Blue -> ${azureBlue}`;
    const stub = await stubQuickPick(fakeResponse);
    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub.restore();

    await vslsApi.share();

    await timeout(1000);

    const color2 = '#68217a';
    const fakeResponse2 = `C# Purple -> ${color2}`;
    const stub2 = await stubQuickPick(fakeResponse2);
    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub2.restore();

    await timeout(1000);

    let config = getColorCustomizationConfig();
    const value = config[ColorSettings.titleBar_activeBackground] as string;

    assert.ok(isValidColorInput(value));
    assert.equal(value, color2);

    await vslsApi.end();
    await updateLiveShareColor(LiveShareSettings.VSLSShareColor, undefined);
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
    const stub2 = await stubQuickPick(fakeResponse2);

    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub2.restore();

    await timeout(1000);

    const color3 = '#b52e31';
    const fakeResponse3 = `Angular Red -> ${color3}`;
    const stub3 = await stubQuickPick(fakeResponse3);

    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub3.restore();

    await timeout(1000);

    const color4 = '#639';
    const fakeResponse4 = `Gatsby Purple -> ${color4}`;
    const stub4 = await stubQuickPick(fakeResponse4);
    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub4.restore();

    await timeout(1000);

    await vslsApi.end();

    await timeout(1000);

    let config = getColorCustomizationConfig();
    const value = config[ColorSettings.titleBar_activeBackground] as string;

    assert.ok(!isValidColorInput(value));
    assert.ok(!value);

    await updateLiveShareColor(LiveShareSettings.VSLSShareColor, undefined);
  });

  test('Workspace color is reverted to a preset color after Live Share session when updated the color multiple times.', async () => {
    const vslsApi = await vsls.getApi();

    if (!vslsApi) {
      throw new Error('Live Share extension is not installed.');
    }

    const startColor = '#007fff';
    const fakeResponse = `Azure Blue -> ${startColor}`;
    const stub = await stubQuickPick(fakeResponse);
    await executeCommand(Commands.changeColorToFavorite);
    stub.restore();

    await vslsApi.share();

    await timeout(1000);

    const color2 = '#68217a';
    const fakeResponse2 = `C# Purple -> ${color2}`;
    const stub2 = await stubQuickPick(fakeResponse2);
    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub2.restore();

    await timeout(1000);

    const color3 = '#b52e31';
    const fakeResponse3 = `Angular Red -> ${color3}`;
    const stub3 = await stubQuickPick(fakeResponse3);
    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub3.restore();

    await timeout(1000);

    const color4 = '#639';
    const fakeResponse4 = `Gatsby Purple -> ${color4}`;
    const stub4 = await stubQuickPick(fakeResponse4);
    await executeCommand(LiveShareCommands.changeColorOfLiveShareHost);
    stub4.restore();

    await timeout(1000);

    await vslsApi.end();

    await timeout(1000);

    let config = getColorCustomizationConfig();
    const value = config[ColorSettings.titleBar_activeBackground] as string;

    assert.ok(isValidColorInput(value));
    assert.equal(value, startColor);

    await updateLiveShareColor(LiveShareSettings.VSLSShareColor, undefined);
  });
});
