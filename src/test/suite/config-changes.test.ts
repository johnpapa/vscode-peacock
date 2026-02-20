import * as vscode from 'vscode';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
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
import { applyColor } from '../../apply-color';
import {
  getColorCustomizationConfigFromWorkspace,
  getOriginalColorsForAllElements,
  getUserConfig,
  updateAffectedElements,
  updateGlobalConfiguration,
  updateWorkspaceConfiguration,
} from '../../configuration';

const delayInMs = 500;

suite('changes to configuration', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  setup(async () => {
    // This suite's tests flips these switches a lot,
    // so we reset before each test just to be sure.
    await executeCommand(Commands.resetWorkspaceColors);
    // Set the test values
    await updateAffectedElements({
      statusBar: true,
      activityBar: true,
      titleBar: true,
    } as IPeacockAffectedElementSettings);
  });

  suite('when starting with no colors in the workspace config', () => {
    test('have no effect', async () => {
      const colors1: IElementColors = getOriginalColorsForAllElements();
      const config1 = getUserConfig();
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
      const colorsBefore: IElementColors = getOriginalColorsForAllElements();
      const configBefore = getUserConfig();
      await updateGlobalConfiguration(AffectedSettings.ActivityBar, false);

      await timeout(delayInMs);

      const colorsAfter: IElementColors = getOriginalColorsForAllElements();
      assert.ok(colorsBefore[ElementNames.activityBar] !== colorsAfter[ElementNames.activityBar]);
      assert.ok(
        !!configBefore[AffectedSettings.StatusBar] &&
          colorsBefore[ElementNames.statusBar] === colorsAfter[ElementNames.statusBar],
      );
      assert.ok(
        !!configBefore[AffectedSettings.TitleBar] &&
          colorsBefore[ElementNames.titleBar] === colorsAfter[ElementNames.titleBar],
      );
    });

    test('will change color when unselecting statusbar', async () => {
      const colors1: IElementColors = getOriginalColorsForAllElements();
      const config1 = getUserConfig();
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
      const config1 = getUserConfig();
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

    test('will preserve setting order', async () => {
      const originalCustomizations = getColorCustomizationConfigFromWorkspace();
      const keptKeys = Object.keys(originalCustomizations).filter((_, i) => i % 2);
      const removedKeys = Object.keys(originalCustomizations).filter((_, i) => ~i % 2);
      removedKeys.forEach(r => delete originalCustomizations[r]);
      await updateWorkspaceConfiguration(originalCustomizations);

      await executeCommand(Commands.changeColorToPeacockGreen);

      const updatedCustomizations = getColorCustomizationConfigFromWorkspace();

      assert.deepEqual(
        Object.keys(updatedCustomizations),
        keptKeys.concat(removedKeys),
        'existing setting order was not preserved',
      );
    });

    test('will not rewrite settings when reapplying the same color', async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      assert.ok(workspaceFolders && workspaceFolders.length > 0, 'workspace was not available');
      const workspaceRoot = workspaceFolders![0].uri.fsPath;
      const settingsPath = path.join(workspaceRoot, '.vscode', 'settings.json');

      const before = await fs.promises.stat(settingsPath);
      await timeout(1100);
      await applyColor('#42b883');
      const after = await fs.promises.stat(settingsPath);

      assert.strictEqual(
        before.mtimeMs,
        after.mtimeMs,
        'settings.json should not be rewritten when there is no color delta',
      );
    });
  });
});
