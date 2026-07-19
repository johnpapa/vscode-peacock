import * as assert from 'assert';
import {
  IPeacockSettings,
  IPeacockAffectedElementSettings,
  Commands,
  ColorSettings,
  peacockGreen,
} from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import {
  getColorCustomizationConfig,
  updateAffectedElements,
  getKeepForegroundColor,
  getKeepBadgeColor,
  getElementStyle,
} from '../../configuration';
import { getColorComplementHex } from '../../color-library';
import { executeCommand, allAffectedElements } from './lib/constants';

suite('Affected elements', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  test('sets color customizations for affected elements', async () => {
    await executeCommand(Commands.changeColorToPeacockGreen);
    const config = getColorCustomizationConfig();
    const keepForegroundColor = getKeepForegroundColor();
    const keepBadgeColor = getKeepBadgeColor();
    const style = getElementStyle(peacockGreen);

    assert.equal(style.backgroundHex, config[ColorSettings.titleBar_activeBackground]);
    assert.equal(style.backgroundHex, config[ColorSettings.activityBar_background]);
    assert.equal(style.backgroundHex, config[ColorSettings.statusBar_background]);
    if (!keepForegroundColor) {
      assert.ok(config[ColorSettings.titleBar_activeForeground]);
      assert.ok(config[ColorSettings.activityBar_foreground]);
      assert.ok(config[ColorSettings.statusBar_foreground]);
    }
    if (!keepBadgeColor) {
      assert.ok(config[ColorSettings.activityBar_badgeBackground]);
      assert.ok(config[ColorSettings.activityBar_badgeForeground]);
    }
  });

  test('does not set main customization tokens when no elements are affected', async () => {
    await updateAffectedElements({
      activityBar: false,
      statusBar: false,
      debuggingStatusBar: false,
      titleBar: false,
      editorGroupBorder: false,
      panelBorder: false,
      sideBarBorder: false,
      sashHover: false,
      tabActiveBorder: false,
      tabActiveBackground: false,
      windowBorder: false,
    } as IPeacockAffectedElementSettings);

    await executeCommand(Commands.changeColorToPeacockGreen);
    const config = getColorCustomizationConfig();
    assert.ok(!config[ColorSettings.titleBar_activeBackground]);
    assert.ok(!config[ColorSettings.activityBar_background]);
    assert.ok(!config[ColorSettings.statusBar_background]);
    await updateAffectedElements(allAffectedElements);
  });

  test('debugging background matches status bar when affectDebuggingStatusBar is false', async () => {
    await updateAffectedElements({
      statusBar: true,
      debuggingStatusBar: false,
      statusAndTitleBorders: true,
    } as IPeacockAffectedElementSettings);

    await executeCommand(Commands.changeColorToPeacockGreen);
    const config = getColorCustomizationConfig();
    assert.equal(config[ColorSettings.statusBar_debuggingBackground], config[ColorSettings.statusBar_background]);
    assert.equal(config[ColorSettings.statusBar_debuggingForeground], config[ColorSettings.statusBar_foreground]);
    assert.ok(!config[ColorSettings.statusBar_debuggingBorder]);
    await updateAffectedElements(allAffectedElements);
  });

  test('debugging background uses complement when debugging status bar is enabled', async () => {
    await updateAffectedElements({ debuggingStatusBar: true } as IPeacockAffectedElementSettings);
    await executeCommand(Commands.changeColorToPeacockGreen);
    const config = getColorCustomizationConfig();
    assert.equal(
      config[ColorSettings.statusBar_debuggingBackground],
      getColorComplementHex(config[ColorSettings.activityBar_background]),
    );
  });
});
