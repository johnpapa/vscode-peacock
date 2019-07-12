import * as vscode from 'vscode';
import * as assert from 'assert';
import {
  Commands,
  ColorSettings,
  IPeacockSettings,
  peacockGreen
} from '../models';
import {
  setupTestSuite,
  teardownTestSuite,
  setupTest
} from './lib/setup-teardown-test-suite';
import { executeCommand } from './lib/constants';
import { isValidColorInput } from '../color-library';
import {
  getPeacockWorkspaceConfig,
  updateWorkspaceConfiguration,
  getExistingColorCustomizations,
  getCurrentColorBeforeAdjustments,
  getFavoriteColors,
  updateSurpriseMeFromFavoritesOnly
} from '../configuration';

suite('can set color to built-in color', () => {
  let originalValues = <IPeacockSettings>{};

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  test('can set color to Peacock Green', testChangingColorToPeacockGreen());

  suite('can set color to Random color', () => {
    test('color is valid', async () => {
      await executeCommand(Commands.changeColorToRandom);
      let config = getPeacockWorkspaceConfig();
      assert.ok(
        isValidColorInput(config[ColorSettings.titleBar_activeBackground])
      );
    });

    test("when 'surprise me from favorites only' is true, color matches a favorite and is not chosen at random", async () => {
      await updateSurpriseMeFromFavoritesOnly(true);
      await executeCommand(Commands.changeColorToRandom);
      const color = getCurrentColorBeforeAdjustments();
      let { values } = getFavoriteColors();
      const match = values.find(item => item.value === color);
      assert.ok(match);
    });
  });

  suite('when resetting colors', () => {
    suiteSetup(async () => await setupTestSuite(originalValues));
    suiteTeardown(async () => await teardownTestSuite(originalValues));
    setup(async () => await setupTest());

    const extraSettingName = 'activityBar.border';
    const extraSettingValue = '#ff0';
    const extraSetting = { 'activityBar.border': extraSettingValue };

    test('leaves pre-existing colorCustomizations', async () => {
      await removeExtraSetting(extraSettingName);
      // Add one non Peacock setting
      await updateWorkspaceConfiguration(extraSetting);

      await executeCommand(Commands.resetColors);
      let config = getPeacockWorkspaceConfig();
      assert.equal(config[extraSettingName], extraSettingValue);
      assert.ok(!config[ColorSettings.titleBar_activeBackground]);
      assert.ok(!config[ColorSettings.statusBar_background]);
      assert.ok(!config[ColorSettings.activityBar_background]);

      await removeExtraSetting(extraSettingName);
    });

    test('removes colorCustomizations if the object is empty', async () => {
      await executeCommand(Commands.resetColors);
      let config = getPeacockWorkspaceConfig();
      assert.ok(!config[ColorSettings.titleBar_activeBackground]);
      assert.ok(!config[ColorSettings.statusBar_background]);
      assert.ok(!config[ColorSettings.activityBar_background]);
    });
  });
});

function testChangingColorToPeacockGreen():
  | ((this: Mocha.ITestCallbackContext, done: MochaDone) => any)
  | undefined {
  return testBuiltInColor(Commands.changeColorToPeacockGreen, peacockGreen);
}

function testBuiltInColor(
  cmd: Commands,
  builtInColor: string
): ((this: Mocha.ITestCallbackContext, done: MochaDone) => any) | undefined {
  return async () => {
    await vscode.commands.executeCommand(cmd);
    let config = getPeacockWorkspaceConfig();
    assert.equal(builtInColor, config[ColorSettings.titleBar_activeBackground]);
  };
}

async function removeExtraSetting(extraSettingName: string) {
  const newColorCustomizations: any = {
    ...getExistingColorCustomizations()
  };
  delete newColorCustomizations[extraSettingName];
  await updateWorkspaceConfiguration(newColorCustomizations);
}
