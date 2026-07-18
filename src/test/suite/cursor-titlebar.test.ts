import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as assert from 'assert';
import { IPeacockSettings, Commands, ColorSettings, ForegroundColors, peacockGreen } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { executeCommand } from './lib/constants';
import { getColorCustomizationConfig } from '../../configuration';
import { getForegroundColorHex } from '../../color-library';

suite('Cursor title bar foreground workaround', () => {
  const originalValues = {} as IPeacockSettings;
  let appNameStub: sinon.SinonStub | undefined;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  teardown(() => {
    if (appNameStub) {
      appNameStub.restore();
      appNameStub = undefined;
    }
  });

  const stubAppName = (name: string) => {
    appNameStub = sinon.stub(vscode.env, 'appName').value(name);
  };

  test('uses the Cursor mid-gray foreground when running in Cursor', async () => {
    stubAppName('Cursor');

    await executeCommand(Commands.changeColorToPeacockGreen);
    const config = getColorCustomizationConfig();

    assert.equal(
      config[ColorSettings.titleBar_activeForeground],
      ForegroundColors.CursorTitleBarForeground,
    );
    assert.equal(
      config[ColorSettings.commandCenter_foreground],
      ForegroundColors.CursorTitleBarForeground,
    );
  });

  test('leaves the computed foreground unchanged for VS Code', async () => {
    stubAppName('Visual Studio Code');

    await executeCommand(Commands.changeColorToPeacockGreen);
    const config = getColorCustomizationConfig();

    const expectedForeground = getForegroundColorHex(peacockGreen);
    assert.notEqual(
      config[ColorSettings.titleBar_activeForeground],
      ForegroundColors.CursorTitleBarForeground,
    );
    assert.equal(config[ColorSettings.titleBar_activeForeground], expectedForeground);
    assert.equal(config[ColorSettings.commandCenter_foreground], expectedForeground);
  });
});
