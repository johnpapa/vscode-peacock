/**
 * Regression tests for issue #538:
 * Activity bar highlight does not work with "on top" layout (VS Code 1.84+).
 *
 * When `workbench.activityBar.location` is set to "top", VS Code uses
 * `activityBarTop.*` color tokens instead of `activityBar.*`.
 * Peacock must set both token families so the highlight applies in either layout.
 */
import * as assert from 'assert';
import { ColorSettings, Commands, peacockGreen } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import {
  getColorCustomizationConfig,
  updateAffectedElements,
  getElementStyle,
  updateKeepForegroundColor,
} from '../../configuration';
import { executeCommand, allAffectedElements } from './lib/constants';
import type { IPeacockSettings, IPeacockAffectedElementSettings } from '../../models';

suite('Activity Bar — "on top" layout (issue #538)', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  suite('activity bar is affected', () => {
    suiteSetup(async () => {
      await updateAffectedElements({
        activityBar: true,
      } as IPeacockAffectedElementSettings);
    });

    test('sets activityBarTop.background to the same value as activityBar.background', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.ok(
        config[ColorSettings.activityBarTop_background],
        'activityBarTop.background should be set',
      );
      assert.equal(
        config[ColorSettings.activityBarTop_background],
        config[ColorSettings.activityBar_background],
        'activityBarTop.background should match activityBar.background',
      );
    });

    test('sets activityBarTop.activeBackground to the same value as activityBar.activeBackground', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.ok(
        config[ColorSettings.activityBarTop_activeBackground],
        'activityBarTop.activeBackground should be set',
      );
      assert.equal(
        config[ColorSettings.activityBarTop_activeBackground],
        config[ColorSettings.activityBar_activeBackground],
        'activityBarTop.activeBackground should match activityBar.activeBackground',
      );
    });

    test('sets activityBarTop.foreground when keepForegroundColor is false', async () => {
      await updateKeepForegroundColor(false);
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      const activityBarStyle = getElementStyle(peacockGreen, 'activityBar');

      assert.ok(
        config[ColorSettings.activityBarTop_foreground],
        'activityBarTop.foreground should be set',
      );
      assert.equal(
        config[ColorSettings.activityBarTop_foreground],
        activityBarStyle.foregroundHex,
        'activityBarTop.foreground should match computed foreground',
      );
    });

    test('sets activityBarTop.inactiveForeground when keepForegroundColor is false', async () => {
      await updateKeepForegroundColor(false);
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      const activityBarStyle = getElementStyle(peacockGreen, 'activityBar');

      assert.ok(
        config[ColorSettings.activityBarTop_inactiveForeground],
        'activityBarTop.inactiveForeground should be set',
      );
      assert.equal(
        config[ColorSettings.activityBarTop_inactiveForeground],
        activityBarStyle.inactiveForegroundHex,
        'activityBarTop.inactiveForeground should match computed inactive foreground',
      );
    });

    test('does not set activityBarTop.foreground when keepForegroundColor is true', async () => {
      await updateKeepForegroundColor(true);
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.ok(
        !config[ColorSettings.activityBarTop_foreground],
        'activityBarTop.foreground should not be set when keepForegroundColor is true',
      );
      assert.ok(
        !config[ColorSettings.activityBarTop_inactiveForeground],
        'activityBarTop.inactiveForeground should not be set when keepForegroundColor is true',
      );
    });

    test('activityBarTop.background matches expected color value for peacock green', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();
      const activityBarStyle = getElementStyle(peacockGreen, 'activityBar');

      assert.equal(
        config[ColorSettings.activityBarTop_background],
        activityBarStyle.backgroundHex,
        'activityBarTop.background should equal the computed activity bar background',
      );
    });

    suiteTeardown(async () => {
      await updateKeepForegroundColor(false);
      await updateAffectedElements(allAffectedElements);
    });
  });

  suite('activity bar is not affected', () => {
    suiteSetup(async () => {
      await updateAffectedElements({
        activityBar: false,
        statusBar: true,
        titleBar: true,
      } as IPeacockAffectedElementSettings);
    });

    test('does not set activityBarTop.background when activity bar is not affected', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.ok(
        !config[ColorSettings.activityBarTop_background],
        'activityBarTop.background should not be set when activity bar is not affected',
      );
    });

    test('does not set activityBarTop.foreground when activity bar is not affected', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.ok(
        !config[ColorSettings.activityBarTop_foreground],
        'activityBarTop.foreground should not be set when activity bar is not affected',
      );
    });

    test('does not set activityBarTop.inactiveForeground when activity bar is not affected', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.ok(
        !config[ColorSettings.activityBarTop_inactiveForeground],
        'activityBarTop.inactiveForeground should not be set when activity bar is not affected',
      );
    });

    suiteTeardown(async () => {
      await updateAffectedElements(allAffectedElements);
    });
  });
});
