import {
  IPeacockSettings,
  Commands,
  ColorSettings,
  peacockGreen
} from '../models';
import { allSetupAndTeardown } from './lib/setup-teardown-test-suite';
import { getPeacockWorkspaceConfig } from '../configuration';
import { executeCommand } from './lib/constants';
import assert = require('assert');
import { getLightenedColorHex, getDarkenedColorHex } from '../color-library';

suite('Darken/Lighten commands', () => {
  let originalValues = <IPeacockSettings>{};
  allSetupAndTeardown(originalValues);
  test('can lighten a color', async () => {
    await executeCommand(Commands.changeColorToPeacockGreen);
    await executeCommand(Commands.lighten);
    let config = getPeacockWorkspaceConfig();

    assert.equal(
      getLightenedColorHex(peacockGreen),
      config[ColorSettings.activityBar_background]
    );
  });

  test('can darken a color', async () => {
    await executeCommand(Commands.changeColorToPeacockGreen);
    await executeCommand(Commands.darken);
    let config = getPeacockWorkspaceConfig();

    assert.equal(
      getDarkenedColorHex(peacockGreen),
      config[ColorSettings.activityBar_background]
    );
  });
});
