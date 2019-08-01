import * as vscode from 'vscode';
import * as assert from 'assert';
import { IPeacockSettings, Commands, getExtension, peacockGreen } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { getStatusBarItem } from '../../statusbar';

suite.skip('StatusBar Tests', () => {
  let originalValues = <IPeacockSettings>{};
  let extension: vscode.Extension<any>;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  suiteSetup(() => {
    extension = <vscode.Extension<any>>getExtension();
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
