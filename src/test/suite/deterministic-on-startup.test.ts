import * as vscode from 'vscode';
import * as assert from 'assert';
import {
  Commands,
  IPeacockSettings,
  IPeacockAffectedElementSettings,
  IElementColors,
  ElementNames,
} from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { executeCommand } from './lib/constants';
import {
  getOriginalColorsForAllElements,
  updateAffectedElements,
  updateDeterministicOnStartup,
  getFavoriteColors,
  updateSurpriseMeFromFavoritesOnly,
  getEnvironmentAwareColor
} from '../../configuration';
import { checkSurpriseMeOnStartupLogic } from '../../extension';

suite('Deterministic on startup', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  setup(async () => {
    await executeCommand(Commands.resetWorkspaceColors);
    await updateAffectedElements({
      statusBar: true,
      activityBar: true,
      titleBar: true,
    } as IPeacockAffectedElementSettings);
  });

  test('when not set has no effect if no customizations exist', async () => {
    await testColorsBeforeAndAfterInitialConfiguration(assert.equal);
  });

  suite('when set', () => {
    setup(async () => {
      await updateDeterministicOnStartup(true);
    });

    test('applies a deterministic random color if no color customizations exist', async () => {
      await testColorsBeforeAndAfterInitialConfiguration(assert.notEqual);
    });

    test('has no effect when color customizations exist', async () => {
      await vscode.commands.executeCommand(Commands.changeColorToPeacockGreen);
      await testColorsBeforeAndAfterInitialConfiguration(assert.equal);
    });

    test('consistently assigns the same color based on the workspace name', async () => { 
      await testConsistencyOfDeterministicColor();
    });

    test('obeys favorites when deterministic on startup is set', async () => {
      await updateSurpriseMeFromFavoritesOnly(true);
      const { values: favorites } = getFavoriteColors();
      await testConsistencyOfDeterministicColor();
      const color = getEnvironmentAwareColor();
      const match = favorites.find(item => item.value.toLowerCase() === color.toLowerCase());
      assert.ok(
        match,
        `chosen color ${color} is not found in the favorites ${JSON.stringify(favorites)}`
      );
      
      
    });

    teardown(async () => {
      await updateDeterministicOnStartup(false);
    });
  });

  async function testColorsBeforeAndAfterInitialConfiguration(assertEquality: EqualityAssertion) {
    const colors1: IElementColors = getOriginalColorsForAllElements();
    await checkSurpriseMeOnStartupLogic();
    const colors2: IElementColors = getOriginalColorsForAllElements();
    assertEquality(colors1[ElementNames.activityBar], colors2[ElementNames.activityBar]);
    assertEquality(colors1[ElementNames.statusBar], colors2[ElementNames.statusBar]);
    assertEquality(colors1[ElementNames.titleBar], colors2[ElementNames.titleBar]);
  }

  async function testConsistencyOfDeterministicColor() {
    await vscode.commands.executeCommand(Commands.resetWorkspaceColors);
    const colors_pre_0: IElementColors = getOriginalColorsForAllElements();
    await checkSurpriseMeOnStartupLogic();
    const colors_post_0: IElementColors = getOriginalColorsForAllElements();
    await vscode.commands.executeCommand(Commands.resetWorkspaceColors);
    const colors_pre_1: IElementColors = getOriginalColorsForAllElements();
    await checkSurpriseMeOnStartupLogic();
    const colors_post_1: IElementColors = getOriginalColorsForAllElements();
    await vscode.commands.executeCommand(Commands.resetWorkspaceColors);
    const colors_pre_2: IElementColors = getOriginalColorsForAllElements();
    await checkSurpriseMeOnStartupLogic();
    const colors_post_2: IElementColors = getOriginalColorsForAllElements();

    // Check that the no-colors are the same
    assert.equal(colors_pre_0[ElementNames.activityBar], colors_pre_1[ElementNames.activityBar]);
    assert.equal(colors_pre_0[ElementNames.statusBar], colors_pre_0[ElementNames.statusBar]);
    assert.equal(colors_pre_0[ElementNames.titleBar], colors_pre_0[ElementNames.titleBar]);

    assert.equal(colors_pre_1[ElementNames.activityBar], colors_pre_2[ElementNames.activityBar]);
    assert.equal(colors_pre_1[ElementNames.statusBar], colors_pre_2[ElementNames.statusBar]);
    assert.equal(colors_pre_1[ElementNames.titleBar], colors_pre_2[ElementNames.titleBar]);

    // Check that the colors are different before and after assignment
    assert.notEqual(colors_pre_0[ElementNames.activityBar], colors_post_0[ElementNames.activityBar]);
    assert.notEqual(colors_pre_0[ElementNames.statusBar], colors_post_0[ElementNames.statusBar]);
    assert.notEqual(colors_pre_0[ElementNames.titleBar], colors_post_0[ElementNames.titleBar]);

    assert.notEqual(colors_pre_1[ElementNames.activityBar], colors_post_1[ElementNames.activityBar]);
    assert.notEqual(colors_pre_1[ElementNames.statusBar], colors_post_1[ElementNames.statusBar]);
    assert.notEqual(colors_pre_1[ElementNames.titleBar], colors_post_1[ElementNames.titleBar]);

    assert.notEqual(colors_pre_2[ElementNames.activityBar], colors_post_2[ElementNames.activityBar]);
    assert.notEqual(colors_pre_2[ElementNames.statusBar], colors_post_2[ElementNames.statusBar]);
    assert.notEqual(colors_pre_2[ElementNames.titleBar], colors_post_2[ElementNames.titleBar]);

    // Check that the colors are the same between runs
    assert.equal(colors_post_0[ElementNames.activityBar], colors_post_1[ElementNames.activityBar]);
    assert.equal(colors_post_0[ElementNames.statusBar], colors_post_1[ElementNames.statusBar]);
    assert.equal(colors_post_0[ElementNames.titleBar], colors_post_1[ElementNames.titleBar]);

    assert.equal(colors_post_1[ElementNames.activityBar], colors_post_2[ElementNames.activityBar]);
    assert.equal(colors_post_1[ElementNames.statusBar], colors_post_2[ElementNames.statusBar]);
    assert.equal(colors_post_1[ElementNames.titleBar], colors_post_2[ElementNames.titleBar]);

  }

  interface EqualityAssertion {
    (actual: any, expected: any, message?: string | Error | undefined): void;
  }
});
