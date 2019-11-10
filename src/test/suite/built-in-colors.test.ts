import * as vscode from 'vscode';
import * as assert from 'assert';
import {
  Commands,
  ColorSettings,
  IPeacockSettings,
  peacockGreen,
  StandardSettings,
} from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { executeCommand } from './lib/constants';
import { isValidColorInput } from '../../color-library';
import {
  getColorCustomizationConfig,
  updateWorkspaceConfiguration,
  getColorCustomizationConfigFromWorkspace,
  getFavoriteColors,
  updateSurpriseMeFromFavoritesOnly,
  getEnvironmentAwareColor,
  getPeacockWorkspace,
} from '../../configuration';

suite('can set color to built-in color', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  test('can set color to Peacock Green', testChangingColorToPeacockGreen());

  test('can set to color and it is stored in workspace config', async () => {
    await executeCommand(Commands.changeColorToRandom);
    const config = getPeacockWorkspace();
    const color = config[StandardSettings.Color];
    assert.ok(color);
    assert.ok(isValidColorInput(color));
  });

  suite('can set color to Random color', () => {
    test('color is valid', async () => {
      await executeCommand(Commands.changeColorToRandom);
      const config = getColorCustomizationConfig();
      assert.ok(isValidColorInput(config[ColorSettings.titleBar_activeBackground]));
    });

    suite(
      'when surpriseMeFromFavoritesOnly is true, color matches a favorite and is not chosen at random',
      () => {
        const limit = 10;
        for (let index = 0; index < limit; index++) {
          test(`test run ${index} of ${limit}`, async () => {
            const { values: favorites } = getFavoriteColors();
            await updateSurpriseMeFromFavoritesOnly(true);
            await executeCommand(Commands.changeColorToRandom);
            const color = getEnvironmentAwareColor();
            const match = favorites.find(item => item.value.toLowerCase === color.toLowerCase);
            assert.ok(
              match,
              `chosen color ${color} is not found in the favorites ${JSON.stringify(favorites)}`,
            );
          });
        }
      },
    );
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

      await executeCommand(Commands.resetWorkspaceColors);
      const config = getColorCustomizationConfig();
      assert.equal(config[extraSettingName], extraSettingValue);
      assert.ok(!config[ColorSettings.titleBar_activeBackground]);
      assert.ok(!config[ColorSettings.statusBar_background]);
      assert.ok(!config[ColorSettings.activityBar_background]);
      assert.ok(!config[ColorSettings.activityBar_activeBorder]);

      await removeExtraSetting(extraSettingName);
    });

    test('removes colorCustomizations if the object is empty', async () => {
      await executeCommand(Commands.resetWorkspaceColors);
      const config = getColorCustomizationConfig();
      assert.ok(!config[ColorSettings.titleBar_activeBackground]);
      assert.ok(!config[ColorSettings.statusBar_background]);
      assert.ok(!config[ColorSettings.activityBar_background]);
      assert.ok(!config[ColorSettings.activityBar_activeBorder]);
    });

    test('removes peacockColor', async () => {
      await executeCommand(Commands.resetWorkspaceColors);
      const config = getPeacockWorkspace();
      assert.ok(!config[StandardSettings.Color]);
    });

    test('removes peacockRemoteColor', async () => {
      await executeCommand(Commands.resetWorkspaceColors);
      const config = getPeacockWorkspace();
      assert.ok(!config[StandardSettings.RemoteColor]);
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
  builtInColor: string,
): ((this: Mocha.ITestCallbackContext, done: MochaDone) => any) | undefined {
  return async () => {
    await vscode.commands.executeCommand(cmd);
    const config = getColorCustomizationConfig();
    assert.equal(builtInColor, config[ColorSettings.titleBar_activeBackground]);
  };
}

async function removeExtraSetting(extraSettingName: string) {
  const newColorCustomizations: any = {
    ...getColorCustomizationConfigFromWorkspace(),
  };
  delete newColorCustomizations[extraSettingName];
  await updateWorkspaceConfiguration(newColorCustomizations);
}
