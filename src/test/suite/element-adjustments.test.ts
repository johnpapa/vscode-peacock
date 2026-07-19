import * as assert from 'assert';
import {
  IPeacockSettings,
  IPeacockElementAdjustments,
  Commands,
  ColorSettings,
  IPeacockAffectedElementSettings,
  peacockGreen,
} from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import {
  updateElementAdjustments,
  getColorCustomizationConfig,
  updateAffectedElements,
} from '../../configuration';
import { executeCommand, allAffectedElements } from './lib/constants';
import { getLightenedColorHex, getDarkenedColorHex } from '../../color-library';

suite('Element adjustments', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  const elementAdjustments: IPeacockElementAdjustments = {
    activityBar: 'lighten',
    statusBar: 'darken',
    titleBar: 'none',
  };

  suiteSetup(async () => {
    await updateElementAdjustments(elementAdjustments);
  });

  test('applies configured lighten and darken adjustments', async () => {
    await executeCommand(Commands.changeColorToPeacockGreen);
    const config = getColorCustomizationConfig();
    assert.equal(getLightenedColorHex(peacockGreen), config[ColorSettings.activityBar_background]);
    assert.equal(getDarkenedColorHex(peacockGreen), config[ColorSettings.statusBar_background]);
  });

  test('only adjusts elements that are affected', async () => {
    await updateAffectedElements({
      activityBar: false,
      statusBar: true,
      titleBar: false,
    } as IPeacockAffectedElementSettings);

    await executeCommand(Commands.changeColorToPeacockGreen);
    const config = getColorCustomizationConfig();
    assert.equal(getDarkenedColorHex(peacockGreen), config[ColorSettings.statusBar_background]);
    assert.ok(!config[ColorSettings.activityBar_background]);
    assert.ok(!config[ColorSettings.titleBar_activeBackground]);
    await updateAffectedElements(allAffectedElements);
  });
});
