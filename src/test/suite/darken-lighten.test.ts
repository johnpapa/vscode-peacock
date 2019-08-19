import * as assert from 'assert';
import { IPeacockSettings, Commands, ColorSettings, peacockGreen } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { getColorCustomizationConfig, getDarkenLightenPercentage } from '../../configuration';
import { executeCommand } from './lib/constants';
import { getLightenedColorHex, getDarkenedColorHex } from '../../color-library';

suite('Darken/Lighten commands', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  test('can lighten a color', async () => {
    await executeCommand(Commands.changeColorToPeacockGreen);
    await executeCommand(Commands.lighten);
    const config = getColorCustomizationConfig();
    const pct = getDarkenLightenPercentage();

    assert.equal(
      getLightenedColorHex(peacockGreen, pct),
      config[ColorSettings.activityBar_background],
    );
  });

  test('can darken a color', async () => {
    await executeCommand(Commands.changeColorToPeacockGreen);
    await executeCommand(Commands.darken);
    const config = getColorCustomizationConfig();
    const pct = getDarkenLightenPercentage();

    assert.equal(
      getDarkenedColorHex(peacockGreen, pct),
      config[ColorSettings.activityBar_background],
    );
  });
});
