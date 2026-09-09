/**
 * Regression coverage for issue #539: match Peacock's current color in the
 * file tree / list selection highlight (list.activeSelectionBackground,
 * list.inactiveSelectionBackground, list.hoverBackground), gated behind
 * peacock.affectFileTreeSelection (default false -- opt-in, since it visibly
 * changes the Explorer/Search selection color for anyone who turns it on).
 */
import * as assert from 'assert';
import { AffectedSettings, ColorSettings, Commands, peacockGreen } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { getColorCustomizationConfig, getElementStyle } from '../../configuration';
import { updateGlobalConfiguration } from '../../configuration';
import { executeCommand } from './lib/constants';
import type { IPeacockSettings } from '../../models';

suite('File tree selection (issue #539)', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  suite('affectFileTreeSelection = true', () => {
    suiteSetup(async () => {
      await updateGlobalConfiguration(AffectedSettings.FileTreeSelection, true);
    });

    test('sets list.activeSelectionBackground to the computed accent color', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();
      const activityBarStyle = getElementStyle(peacockGreen, 'activityBar');

      assert.equal(
        config[ColorSettings.list_activeSelectionBackground],
        activityBarStyle.backgroundHex,
      );
    });

    test('sets list.inactiveSelectionBackground to the computed inactive accent color', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();
      const activityBarStyle = getElementStyle(peacockGreen, 'activityBar');

      assert.equal(
        config[ColorSettings.list_inactiveSelectionBackground],
        activityBarStyle.inactiveBackgroundHex,
      );
    });

    test('sets list.hoverBackground to the computed hover accent color', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();
      const activityBarStyle = getElementStyle(peacockGreen, 'activityBar');

      assert.equal(
        config[ColorSettings.list_hoverBackground],
        activityBarStyle.backgroundHoverHex,
      );
    });

    suiteTeardown(async () => {
      await updateGlobalConfiguration(AffectedSettings.FileTreeSelection, false);
    });
  });

  suite('affectFileTreeSelection = false (default)', () => {
    suiteSetup(async () => {
      await updateGlobalConfiguration(AffectedSettings.FileTreeSelection, false);
    });

    test('does not set any list.* color customizations', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.ok(!config[ColorSettings.list_activeSelectionBackground]);
      assert.ok(!config[ColorSettings.list_inactiveSelectionBackground]);
      assert.ok(!config[ColorSettings.list_hoverBackground]);
    });
  });
});
