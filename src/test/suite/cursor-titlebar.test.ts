import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as assert from 'assert';
import * as tinycolor from 'tinycolor2';
import {
  IPeacockSettings,
  Commands,
  ColorSettings,
  ForegroundColors,
  peacockGreen,
  ReadabilityRatios,
} from '../../models';
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

  test('uses the Cursor mid-gray foreground when running in Cursor on light backgrounds', async () => {
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

  test('keeps readable title bar contrast in Cursor on dark schemes', async () => {
    stubAppName('Cursor');

    // Apply a dark blue color (Mandalorian Blue - #1857a4)
    const darkColor = '#1857a4';
    await executeCommand(Commands.enterColor, darkColor);

    const config = getColorCustomizationConfig();
    const bg = config[ColorSettings.titleBar_activeBackground];
    const fg = config[ColorSettings.titleBar_activeForeground];

    // For dark backgrounds, Cursor should use the adaptive light foreground (#e7e7e7)
    // instead of the mid-gray CursorTitleBarForeground (#595959)
    assert.equal(
      fg,
      ForegroundColors.LightForeground,
      'Should use adaptive light foreground on dark backgrounds',
    );

    // Verify the contrast meets WCAG AA standard (4.5:1 for text)
    const ratio = tinycolor.readability(bg, fg);
    assert.ok(
      ratio >= ReadabilityRatios.Text,
      `Title bar contrast ${ratio.toFixed(2)}:1 should meet WCAG AA (${ReadabilityRatios.Text}:1)`,
    );
  });
});
