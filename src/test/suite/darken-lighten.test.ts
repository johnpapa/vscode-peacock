import {
  IPeacockSettings,
  Commands,
  ColorSettings,
  peacockGreen
} from '../../models';
import {
  setupTestSuite,
  teardownTestSuite,
  setupTest
} from './lib/setup-teardown-test-suite';
import {
  getPeacockWorkspaceConfig,
  getDarkenLightenPercentage
} from '../../configuration';
import { executeCommand } from './lib/constants';
import assert = require('assert');
import { getLightenedColorHex, getDarkenedColorHex } from '../../color-library';

suite('Darken/Lighten commands', () => {
  let originalValues = <IPeacockSettings>{};

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  test('can lighten a color', async () => {
    await executeCommand(Commands.changeColorToPeacockGreen);
    await executeCommand(Commands.lighten);
    let config = getPeacockWorkspaceConfig();
    const pct = getDarkenLightenPercentage();

    assert.equal(
      getLightenedColorHex(peacockGreen, pct),
      config[ColorSettings.activityBar_background]
    );
  });

  test('can darken a color', async () => {
    await executeCommand(Commands.changeColorToPeacockGreen);
    await executeCommand(Commands.darken);
    let config = getPeacockWorkspaceConfig();
    const pct = getDarkenLightenPercentage();

    assert.equal(
      getDarkenedColorHex(peacockGreen, pct),
      config[ColorSettings.activityBar_background]
    );
  });
});
