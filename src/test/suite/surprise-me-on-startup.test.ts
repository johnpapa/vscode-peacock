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
  updateSurpriseMeOnStartup,
} from '../../configuration';
import { checkSurpriseMeOnStartupLogic } from '../../extension';

suite('Surprise me on startup', () => {
  let originalValues = <IPeacockSettings>{};

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  setup(async () => {
    await executeCommand(Commands.resetWorkspaceColors);
    await updateAffectedElements(<IPeacockAffectedElementSettings>{
      statusBar: true,
      activityBar: true,
      titleBar: true,
    });
  });

  test('when not set has no effect if no customizations exist', async () => {
    await testColorsBeforeAndAfterInitialConfiguration(assert.equal);
  });

  suite('when set', () => {
    setup(async () => {
      await updateSurpriseMeOnStartup(true);
    });

    test('applies a random color if no color customizations exist', async () => {
      await testColorsBeforeAndAfterInitialConfiguration(assert.notEqual);
    });

    test('has no effect when color customizations exist', async () => {
      await vscode.commands.executeCommand(Commands.changeColorToPeacockGreen);
      await testColorsBeforeAndAfterInitialConfiguration(assert.equal);
    });

    teardown(async () => {
      await updateSurpriseMeOnStartup(false);
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

  interface EqualityAssertion {
    (actual: any, expected: any, message?: string | Error | undefined): void;
  }
});
