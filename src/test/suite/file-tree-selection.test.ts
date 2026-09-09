/**
 * Regression coverage for issue #539: outline the focused/selected item in the
 * file tree / list views with Peacock's current accent color (list.focusOutline,
 * list.focusAndSelectionOutline, list.inactiveFocusOutline), gated behind
 * peacock.affectFileTreeSelection (default false -- opt-in). The theme's own
 * selection/hover fills are deliberately left alone.
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

    test('sets list.focusOutline to the computed accent color', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();
      const activityBarStyle = getElementStyle(peacockGreen, 'activityBar');

      assert.equal(config[ColorSettings.list_focusOutline], activityBarStyle.backgroundHex);
    });

    test('sets list.focusAndSelectionOutline to the computed accent color', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();
      const activityBarStyle = getElementStyle(peacockGreen, 'activityBar');

      assert.equal(
        config[ColorSettings.list_focusAndSelectionOutline],
        activityBarStyle.backgroundHex,
      );
    });

    test('sets list.inactiveFocusOutline to the computed accent color', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();
      const activityBarStyle = getElementStyle(peacockGreen, 'activityBar');

      assert.equal(config[ColorSettings.list_inactiveFocusOutline], activityBarStyle.backgroundHex);
    });

    test('does not touch the selection or hover background fills', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.ok(!config['list.activeSelectionBackground']);
      assert.ok(!config['list.inactiveSelectionBackground']);
      assert.ok(!config['list.hoverBackground']);
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

      assert.ok(!config[ColorSettings.list_focusOutline]);
      assert.ok(!config[ColorSettings.list_focusAndSelectionOutline]);
      assert.ok(!config[ColorSettings.list_inactiveFocusOutline]);
    });
  });
});
