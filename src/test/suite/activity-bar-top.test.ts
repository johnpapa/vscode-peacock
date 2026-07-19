import * as assert from 'assert';
import { ColorSettings, Commands, IPeacockSettings, IPeacockAffectedElementSettings } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { getColorCustomizationConfig, updateAffectedElements } from '../../configuration';
import { executeCommand, allAffectedElements } from './lib/constants';

suite('Activity Bar — "on top" layout (issue #538)', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  test('sets activityBarTop token values when activity bar is affected', async () => {
    await updateAffectedElements({ activityBar: true } as IPeacockAffectedElementSettings);
    await executeCommand(Commands.changeColorToPeacockGreen);
    const config = getColorCustomizationConfig();

    assert.equal(config[ColorSettings.activityBarTop_background], config[ColorSettings.activityBar_background]);
    assert.equal(
      config[ColorSettings.activityBarTop_activeBackground],
      config[ColorSettings.activityBar_activeBackground],
    );
  });

  test('does not set activityBarTop tokens when activity bar is not affected', async () => {
    await updateAffectedElements({
      activityBar: false,
      statusBar: true,
      titleBar: true,
    } as IPeacockAffectedElementSettings);
    await executeCommand(Commands.changeColorToPeacockGreen);
    const config = getColorCustomizationConfig();

    assert.ok(!config[ColorSettings.activityBarTop_background]);
    assert.ok(!config[ColorSettings.activityBarTop_foreground]);
    await updateAffectedElements(allAffectedElements);
  });
});
