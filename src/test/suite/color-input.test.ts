import * as assert from 'assert';
import { ColorSettings, Commands, IPeacockSettings } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { executeCommand } from './lib/constants';
import { getColorCustomizationConfig } from '../../configuration';

suite('Enter color', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  test('can set valid color via command parameter', async () => {
    await executeCommand(Commands.enterColor, '#c0c0c0');
    const config = getColorCustomizationConfig();
    assert.equal('#c0c0c0', config[ColorSettings.titleBar_activeBackground]);
  });

  test('rejects invalid color via command parameter', async () => {
    await assert.rejects(async () => await executeCommand(Commands.enterColor, 'invalid'), Error);
    const config = getColorCustomizationConfig();
    assert.ok(!config[ColorSettings.titleBar_activeBackground]);
  });
});
