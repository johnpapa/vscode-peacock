import * as assert from 'assert';
import * as vscode from 'vscode';
import { Commands, IPeacockSettings, peacockGreen } from '../../models';
import { getExtension } from '../../models/extension';
import { getStatusBarItem } from '../../statusbar';
import { setupTest, setupTestSuite, teardownTestSuite } from './lib/setup-teardown-test-suite';

suite.skip('StatusBar Tests', () => {
  const originalValues = {} as IPeacockSettings;
  let extension: vscode.Extension<any>;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  suiteSetup(() => {
    extension = getExtension() as vscode.Extension<any>;
  });

  test('status bar', async () => {
    await extension.activate();

    await vscode.commands.executeCommand(Commands.changeColorToPeacockGreen);

    // show the status bar
    // await vscode.workspace
    //   .getConfiguration()
    //   .update('peacock.showColorInStatusBar', true, vscode.ConfigurationTarget.Global);

    const s = getStatusBarItem();

    // status bar should exist
    assert.ok(!!s);

    // status bar text should not be undefined

    assert.ok(s.text !== undefined);

    // statusbar text should have text
    assert.ok(s.text.length);

    // statusbar text should include current color
    assert.ok(s.text.includes(peacockGreen));
  });
});
