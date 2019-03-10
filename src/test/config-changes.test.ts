import * as vscode from 'vscode';
import * as assert from 'assert';
import {
  Commands,
  IPeacockSettings,
  AffectedSettings,
  IElementColors,
  ElementNames,
  IPeacockAffectedElementSettings
} from '../models';
import { allSetupAndTeardown } from './lib/setup-teardown-test-suite';
import { executeCommand } from './lib/constants';
import {
  updateConfiguration,
  getOriginalColorsForAllElements,
  getUserConfig,
  updateAffectedElements
} from '../configuration';
import { timeout } from './lib/helpers';

suite('changes to configuration', () => {
  let originalValues = <IPeacockSettings>{};
  allSetupAndTeardown(originalValues);

  setup(async () => {
    await executeCommand(Commands.resetColors);
    await updateAffectedElements(<IPeacockAffectedElementSettings>{
      statusBar: true,
      activityBar: true,
      titleBar: true
    });
  });

  suite('when starting with no colors in the workspace config', () => {
    test('have no effect', async () => {
      let config1 = getUserConfig();
      const colors1: IElementColors = getOriginalColorsForAllElements();
      await updateConfiguration(
        AffectedSettings.ActivityBar,
        !config1[AffectedSettings.ActivityBar]
      );

      await timeout(100);

      const colors2: IElementColors = getOriginalColorsForAllElements();
      assert.ok(
        colors1[ElementNames.activityBar] === colors2[ElementNames.activityBar]
      );
      assert.ok(
        !!config1[AffectedSettings.StatusBar] &&
          colors1[ElementNames.statusBar] === colors2[ElementNames.statusBar]
      );
      assert.ok(
        !!config1[AffectedSettings.TitleBar] &&
          colors1[ElementNames.titleBar] === colors2[ElementNames.titleBar]
      );
    });
  });

  suite('when starting with a color in the workspace config', () => {
    suite('will change color when', () => {
      test('unselecting activitybar', async () => {
        const startingColor = Commands.changeColorToVueGreen;
        await vscode.commands.executeCommand(startingColor);

        let config1 = getUserConfig();
        const colors1: IElementColors = getOriginalColorsForAllElements();
        await updateConfiguration(
          AffectedSettings.ActivityBar,
          !config1[AffectedSettings.ActivityBar]
        );

        await timeout(100);

        const colors2: IElementColors = getOriginalColorsForAllElements();
        assert.ok(
          colors1[ElementNames.activityBar] !==
            colors2[ElementNames.activityBar]
        );
        assert.ok(
          !!config1[AffectedSettings.StatusBar] &&
            colors1[ElementNames.statusBar] === colors2[ElementNames.statusBar]
        );
        assert.ok(
          !!config1[AffectedSettings.TitleBar] &&
            colors1[ElementNames.titleBar] === colors2[ElementNames.titleBar]
        );
      });

      test('unselecting statusbar', async () => {
        const startingColor = Commands.changeColorToVueGreen;
        await vscode.commands.executeCommand(startingColor);

        let config1 = getUserConfig();
        const colors1: IElementColors = getOriginalColorsForAllElements();
        await updateConfiguration(
          AffectedSettings.StatusBar,
          !config1[AffectedSettings.StatusBar]
        );

        await timeout(100);

        const colors2: IElementColors = getOriginalColorsForAllElements();
        assert.ok(
          colors1[ElementNames.statusBar] !== colors2[ElementNames.statusBar]
        );
        assert.ok(
          !!config1[AffectedSettings.ActivityBar] &&
            colors1[ElementNames.activityBar] ===
              colors2[ElementNames.activityBar]
        );
        assert.ok(
          !!config1[AffectedSettings.TitleBar] &&
            colors1[ElementNames.titleBar] === colors2[ElementNames.titleBar]
        );
      });

      test('unselecting titlebar', async () => {
        const startingColor = Commands.changeColorToVueGreen;
        await vscode.commands.executeCommand(startingColor);

        let config1 = getUserConfig();
        const colors1: IElementColors = getOriginalColorsForAllElements();
        await updateConfiguration(
          AffectedSettings.TitleBar,
          !config1[AffectedSettings.TitleBar]
        );

        await timeout(100);
        const colors2: IElementColors = getOriginalColorsForAllElements();
        assert.ok(
          colors1[ElementNames.titleBar] !== colors2[ElementNames.titleBar]
        );
        assert.ok(
          !!config1[AffectedSettings.ActivityBar] &&
            colors1[ElementNames.activityBar] ===
              colors2[ElementNames.activityBar]
        );
        assert.ok(
          !!config1[AffectedSettings.StatusBar] &&
            colors1[ElementNames.statusBar] === colors2[ElementNames.statusBar]
        );
      });
    });
  });
});
