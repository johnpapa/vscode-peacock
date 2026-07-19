import * as assert from 'assert';
import { Commands, IPeacockSettings } from '../../models';
import { executeCommand, stubQuickPick } from './lib/constants';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { getColorCustomizationConfig } from '../../configuration';

const SIDEBAR_BACKGROUND_KEY = 'sideBar.background';

suite('Set SideBar Darkness Level Command', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => {
    await setupTest();
    await executeCommand(Commands.changeColorToPeacockGreen);
  });

  test('sets sidebar background to Dark, Darker, and Darkest with increasing darkness', async () => {
    let stub = await stubQuickPick('Dark');
    await executeCommand(Commands.affectSideBarBackground);
    stub.restore();
    const dark = getColorCustomizationConfig()[SIDEBAR_BACKGROUND_KEY];

    stub = await stubQuickPick('Darker');
    await executeCommand(Commands.affectSideBarBackground);
    stub.restore();
    const darker = getColorCustomizationConfig()[SIDEBAR_BACKGROUND_KEY];

    stub = await stubQuickPick('Darkest');
    await executeCommand(Commands.affectSideBarBackground);
    stub.restore();
    const darkest = getColorCustomizationConfig()[SIDEBAR_BACKGROUND_KEY];

    assert.ok(dark, 'Dark should set a color');
    assert.ok(darker, 'Darker should set a color');
    assert.ok(darkest, 'Darkest should set a color');
    assert.notStrictEqual(dark, darker, 'Dark and Darker should be different');
    assert.notStrictEqual(darker, darkest, 'Darker and Darkest should be different');
    assert.notStrictEqual(dark, darkest, 'Dark and Darkest should be different');
  });
});
