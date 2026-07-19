import * as assert from 'assert';
import { Commands, ColorSettings, IPeacockSettings, peacockGreen } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { executeCommand } from './lib/constants';
import { isValidColorInput } from '../../color-library';
import { getColorCustomizationConfig, getPeacockWorkspace } from '../../configuration';

suite('can set color to built-in color', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  test('can set color to Peacock Green', async () => {
    await executeCommand(Commands.changeColorToPeacockGreen);
    const config = getColorCustomizationConfig();
    assert.equal(peacockGreen, config[ColorSettings.titleBar_activeBackground]);
  });

  test('can set color to random valid color', async () => {
    await executeCommand(Commands.changeColorToRandom);
    const config = getColorCustomizationConfig();
    assert.ok(isValidColorInput(config[ColorSettings.titleBar_activeBackground]));
  });

  test('stores selected color in workspace config', async () => {
    await executeCommand(Commands.changeColorToRandom);
    const config = getPeacockWorkspace();
    assert.ok(isValidColorInput(config['color']));
  });
});
