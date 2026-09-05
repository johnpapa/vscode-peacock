import * as assert from 'assert';
import { Commands, ColorSettings, IPeacockSettings, azureBlue } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { executeCommand } from './lib/constants';
import { applyColor } from '../../apply-color';
import {
  getColorCustomizationConfig,
  getColorCustomizationConfigFromWorkspace,
  updateWorkspaceConfiguration,
  updateExcludedSettings,
} from '../../configuration';

suite('Excluded Settings Tests', () => {
  const originalValues = {} as IPeacockSettings;

  // A color the user set themselves that Peacock must never touch.
  const userValue = '#abcdef';
  const excludedKey = ColorSettings.statusBar_background;
  const nonExcludedKey = ColorSettings.statusBar_foreground;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  async function seedUserColor() {
    await updateWorkspaceConfiguration({ [excludedKey]: userValue });
  }

  test('an excluded key is NOT overwritten when a Peacock color is applied', async () => {
    await updateExcludedSettings([excludedKey]);
    await seedUserColor();

    await applyColor(azureBlue);

    const config = getColorCustomizationConfig();
    assert.equal(
      config[excludedKey],
      userValue,
      'Excluded key should keep the user value, not be overwritten by Peacock',
    );
    // A non-excluded key should still be colored by Peacock.
    assert.ok(config[nonExcludedKey], 'Non-excluded key should be applied by Peacock');
  });

  test('an excluded key is NOT deleted on reset/unapply (removeAllColors)', async () => {
    await updateExcludedSettings([excludedKey]);
    await seedUserColor();

    await applyColor(azureBlue);
    await executeCommand(Commands.removeAllColors);

    const config = getColorCustomizationConfigFromWorkspace();
    assert.equal(
      config[excludedKey],
      userValue,
      'Excluded key should survive removeAllColors and keep the user value',
    );
    // Non-excluded Peacock keys should be cleaned up.
    assert.ok(
      !config[ColorSettings.titleBar_activeBackground],
      'Non-excluded Peacock keys should be removed on reset',
    );
  });

  test('non-excluded keys still behave normally (applied and cleaned up)', async () => {
    await updateExcludedSettings([]);

    await applyColor(azureBlue);

    let config: any = getColorCustomizationConfig();
    assert.equal(
      config[excludedKey],
      azureBlue,
      'With no exclusions, the status bar background should be the applied Peacock color',
    );

    await executeCommand(Commands.removeAllColors);

    config = getColorCustomizationConfigFromWorkspace();
    assert.ok(
      !config[excludedKey],
      'With no exclusions, the status bar background should be cleaned up on reset',
    );
  });
});
