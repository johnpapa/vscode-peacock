import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as assert from 'assert';
import { IPeacockSettings, Commands, peacockGreen, azureBlue } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { executeCommand } from './lib/constants';
import { getEnvironmentAwareColor } from '../../configuration';

suite('Current Color Tests', () => {
  let originalValues = <IPeacockSettings>{};

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  suite('when running the "show color" command', async () => {
    test('Shows the current color', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      await executeCommand(Commands.showAndCopyCurrentColor);
      const color = getEnvironmentAwareColor();
      assert.equal(color, peacockGreen);
    });
    test('Shows the current color when it is a custom color', async () => {
      const fakeResponse = `Azure Blue -> ${azureBlue}`;
      const stub = await sinon
        .stub(vscode.window, 'showQuickPick')
        .returns(Promise.resolve<any>(fakeResponse));

      await executeCommand(Commands.changeColorToFavorite);
      const color = getEnvironmentAwareColor();
      stub.restore();

      await executeCommand(Commands.showAndCopyCurrentColor);
      assert.equal(color, azureBlue);
    });
    test('Shows no color when none is set', async () => {
      await executeCommand(Commands.showAndCopyCurrentColor);
      const color = getEnvironmentAwareColor();
      assert.equal(color, '');
    });
    test('Copies to the clipboard', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      await executeCommand(Commands.showAndCopyCurrentColor);
      const clipboardColor = await vscode.env.clipboard.readText();
      assert.equal(clipboardColor, peacockGreen);
    });
  });
});
