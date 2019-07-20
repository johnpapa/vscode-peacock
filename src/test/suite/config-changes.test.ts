import * as vscode from 'vscode';
import * as assert from 'assert';
import {
  Commands,
  IPeacockSettings,
  AffectedSettings,
  IElementColors,
  ElementNames,
  IPeacockAffectedElementSettings,
  timeout,
} from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { executeCommand } from './lib/constants';
import {
  getOriginalColorsForAllElements,
  getUserConfig,
  updateAffectedElements,
  updateGlobalConfiguration,
} from '../../configuration';

const delayInMs = 500;

suite('changes to configuration', () => {
  let originalValues = <IPeacockSettings>{};

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  setup(async () => {
    // This suite's tests flips these switches a lot,
    // so we reset before each test just to be sure.
    await executeCommand(Commands.resetColors);
    // Set the test values
    await updateAffectedElements(<IPeacockAffectedElementSettings>{
      statusBar: true,
      activityBar: true,
      titleBar: true,
    });
  });

  suite('when starting with no colors in the workspace config', () => {
    test('have no effect', async () => {
      const colors1: IElementColors = getOriginalColorsForAllElements();
      let config1 = getUserConfig();
      await updateGlobalConfiguration(
        AffectedSettings.ActivityBar,
        !config1[AffectedSettings.ActivityBar],
      );

      await timeout(delayInMs);

      const colors2: IElementColors = getOriginalColorsForAllElements();
      assert.ok(colors1[ElementNames.activityBar] === colors2[ElementNames.activityBar]);
      assert.ok(
        !!config1[AffectedSettings.StatusBar] &&
          colors1[ElementNames.statusBar] === colors2[ElementNames.statusBar],
      );
      assert.ok(
        !!config1[AffectedSettings.TitleBar] &&
          colors1[ElementNames.titleBar] === colors2[ElementNames.titleBar],
      );
    });
  });

  suite('when starting with a color in the workspace config', () => {
    setup(async () => {
      // Use Peacock Green as the color the instance began with
      await vscode.commands.executeCommand(Commands.changeColorToPeacockGreen);
    });

    test('will change color when unselecting activitybar', async () => {
      const colors1: IElementColors = getOriginalColorsForAllElements();
      let config1 = getUserConfig();
      await updateGlobalConfiguration(
        AffectedSettings.ActivityBar,
        !config1[AffectedSettings.ActivityBar],
      );

      await timeout(delayInMs);

      const colors2: IElementColors = getOriginalColorsForAllElements();
      assert.ok(colors1[ElementNames.activityBar] !== colors2[ElementNames.activityBar]);
      assert.ok(
        !!config1[AffectedSettings.StatusBar] &&
          colors1[ElementNames.statusBar] === colors2[ElementNames.statusBar],
      );
      assert.ok(
        !!config1[AffectedSettings.TitleBar] &&
          colors1[ElementNames.titleBar] === colors2[ElementNames.titleBar],
      );
    });

    test('will change color when unselecting statusbar', async () => {
      const colors1: IElementColors = getOriginalColorsForAllElements();
      let config1 = getUserConfig();
      await updateGlobalConfiguration(
        AffectedSettings.StatusBar,
        !config1[AffectedSettings.StatusBar],
      );

      await timeout(delayInMs);

      const colors2: IElementColors = getOriginalColorsForAllElements();
      assert.ok(colors1[ElementNames.statusBar] !== colors2[ElementNames.statusBar]);
      assert.ok(
        !!config1[AffectedSettings.ActivityBar] &&
          colors1[ElementNames.activityBar] === colors2[ElementNames.activityBar],
      );
      assert.ok(
        !!config1[AffectedSettings.TitleBar] &&
          colors1[ElementNames.titleBar] === colors2[ElementNames.titleBar],
      );
    });

    test('will change color when unselecting titlebar', async () => {
      let config1 = getUserConfig();
      const colors1: IElementColors = getOriginalColorsForAllElements();
      await updateGlobalConfiguration(
        AffectedSettings.TitleBar,
        !config1[AffectedSettings.TitleBar],
      );

      await timeout(delayInMs);
      const colors2: IElementColors = getOriginalColorsForAllElements();
      assert.ok(colors1[ElementNames.titleBar] !== colors2[ElementNames.titleBar]);
      assert.ok(
        !!config1[AffectedSettings.ActivityBar] &&
          colors1[ElementNames.activityBar] === colors2[ElementNames.activityBar],
      );
      assert.ok(
        !!config1[AffectedSettings.StatusBar] &&
          colors1[ElementNames.statusBar] === colors2[ElementNames.statusBar],
      );
    });
  });
});
