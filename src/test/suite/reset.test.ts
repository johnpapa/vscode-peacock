import * as assert from 'assert';
import { IPeacockSettings, ElementNames, peacockGreen, azureBlue, Commands } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import {
  getOriginalColorsForAllElements,
  updatePeacockColorInUserSettings,
  updatePeacockColor,
  getPeacockColor,
} from '../../configuration';
import { executeCommand } from './lib/constants';

suite('Reset Tests', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  suite('when resetting workspace colors', () => {
    test('when global color exists, workspace still has colors applied', async () => {
      await updatePeacockColorInUserSettings(peacockGreen);
      await updatePeacockColor(azureBlue);

      await executeCommand(Commands.resetWorkspaceColors);

      const color = getPeacockColor();
      const appliedColors = getOriginalColorsForAllElements();

      assert.equal(color, peacockGreen, 'Color should be equal to what is in the User Settings');
      assert.equal(
        appliedColors[ElementNames.statusBar],
        peacockGreen,
        'Applied color should be equal to what is in the User Settings',
      );
    });

    test('when global color does not exist, no colors should be in the workspace color customizations', async () => {
      await updatePeacockColorInUserSettings(undefined);
      await updatePeacockColor(azureBlue);

      await executeCommand(Commands.resetWorkspaceColors);

      const color = getPeacockColor();
      const appliedColors = getOriginalColorsForAllElements();

      assert.ok(
        !color,
        'Color should be undefined since there are no peacock.color in any settings',
      );
      assert.ok(!appliedColors[ElementNames.statusBar], 'No colors should be applied');
    });
  });

  test('when removing all colors, no colors nor color customizations remain', async () => {
    await updatePeacockColorInUserSettings(peacockGreen);
    await updatePeacockColor(azureBlue);

    await executeCommand(Commands.removeAllColors);

    const color = getPeacockColor();
    const appliedColors = getOriginalColorsForAllElements();

    assert.ok(!color, 'Color should be undefined since there are no peacock.color in any settings');
    assert.ok(!appliedColors[ElementNames.statusBar], 'No colors should be applied');
  });
});
