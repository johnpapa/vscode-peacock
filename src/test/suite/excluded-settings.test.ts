import * as assert from 'assert';
import { ColorSettings, IPeacockSettings, azureBlue } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { applyColor } from '../../apply-color';
import {
  getColorCustomizationConfig,
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

});
