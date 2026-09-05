import * as vscode from 'vscode';
import * as assert from 'assert';
import { ConfigurationTarget } from 'vscode';

import { IPeacockSettings, peacockGreen } from '../../models';
import { applyColor } from '../../apply-color';
import {
  getColorCustomizationConfig,
  getColorCustomizationConfigFromWorkspace,
} from '../../configuration';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';

suite('Modern UI Compatibility Tests', () => {
  const originalValues = {} as IPeacockSettings;
  let originalModernUISetting: boolean | undefined;

  suiteSetup(async () => {
    await setupTestSuite(originalValues);
    originalModernUISetting = vscode.workspace
      .getConfiguration('workbench')
      .get<boolean>('experimental.modernUI');
  });

  suiteTeardown(async () => {
    await vscode.workspace
      .getConfiguration('workbench')
      .update('experimental.modernUI', originalModernUISetting, ConfigurationTarget.Workspace);
    await teardownTestSuite(originalValues);
  });

  setup(async () => await setupTest());

  teardown(async () => {
    await vscode.workspace
      .getConfiguration('workbench')
      .update('experimental.modernUI', undefined, ConfigurationTarget.Workspace);
  });

  test('applies the same color customizations whether modernUI is enabled or disabled', async () => {
    await vscode.workspace
      .getConfiguration('workbench')
      .update('experimental.modernUI', false, ConfigurationTarget.Workspace);
    await applyColor(peacockGreen);
    const classicConfig = { ...getColorCustomizationConfigFromWorkspace() };

    await vscode.workspace
      .getConfiguration('workbench')
      .update('experimental.modernUI', true, ConfigurationTarget.Workspace);
    await applyColor(peacockGreen);
    const modernConfig = { ...getColorCustomizationConfigFromWorkspace() };

    assert.deepStrictEqual(
      modernConfig,
      classicConfig,
      'Peacock should write identical workbench.colorCustomizations regardless of workbench.experimental.modernUI',
    );
  });

  test('applies a color successfully when modernUI is enabled', async () => {
    await vscode.workspace
      .getConfiguration('workbench')
      .update('experimental.modernUI', true, ConfigurationTarget.Workspace);

    const color = await applyColor(peacockGreen);

    assert.ok(color, 'applyColor should still apply and return a color when modernUI is enabled');
    const config = getColorCustomizationConfig();
    assert.ok(
      Object.keys(config).length > 0,
      'workbench.colorCustomizations should be written when modernUI is enabled',
    );
  });
});
