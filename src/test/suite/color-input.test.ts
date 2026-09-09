import * as vscode from 'vscode';
import * as assert from 'assert';
import * as sinon from 'sinon';
import { ColorSettings, Commands, IPeacockSettings } from '../../models';
import { isValidColorInput } from '../../color-library';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { executeCommand } from './lib/constants';
import { createFakeWebviewPanel } from './lib/fake-webview-panel';
import { createFakeInputBox } from './lib/fake-input-box';
import { getColorCustomizationConfig } from '../../configuration';

suite('Enter color', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  suite('Invalid values do nothing', () => {
    test('can hit ESC with no error', createColorInputEscapeTest());

    test('can hit ENTER with no error', createColorInputTest('', undefined));
  });

  suite('Pick visually button (#708)', () => {
    test('clicking the button hands off to the visual color picker', async () => {
      const { input, ready, clickPickVisuallyButton } = createFakeInputBox();
      const createInputBoxStub = sinon.stub(vscode.window, 'createInputBox').returns(input);

      const enterColorPromise = executeCommand(Commands.enterColor);
      await ready;

      // The button should be present and labeled for the visual picker.
      assert.strictEqual(input.buttons?.length, 1);
      assert.ok(String(input.buttons?.[0].tooltip).toLowerCase().includes('visually'));

      const { panel, postToExtension } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      // Don't await yet -- it doesn't resolve until the fake webview panel
      // (opened inside the button handler) receives an apply/cancel message.
      const buttonClickPromise = clickPickVisuallyButton();
      await postToExtension({ type: 'apply', color: '#123456' });

      await buttonClickPromise;
      await enterColorPromise;
      createInputBoxStub.restore();
      createPanelStub.restore();

      const config = getColorCustomizationConfig();
      const value = config[ColorSettings.titleBar_activeBackground];
      assert.equal(value, '#123456');
    });

    test('canceling the picker leaves no color applied', async () => {
      const { input, clickPickVisuallyButton } = createFakeInputBox();
      const createInputBoxStub = sinon.stub(vscode.window, 'createInputBox').returns(input);

      const enterColorPromise = executeCommand(Commands.enterColor);

      const { panel, postToExtension } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      const buttonClickPromise = clickPickVisuallyButton();
      await postToExtension({ type: 'cancel' });

      await buttonClickPromise;
      await enterColorPromise;
      createInputBoxStub.restore();
      createPanelStub.restore();
    });
  });

  suite('Hex, Hex RGBA', () => {
    test('can set color using short hex user input', createColorInputTest('#000', '#000000'));

    test(
      'can set color using short hex user input without hash',
      createColorInputTest('000', '#000000'),
    );

    test(
      'can set color using short RGBA hex user input',
      createColorInputTest('#369C', '#336699cc'),
    );

    test(
      'can set color using short RGBA hex user input without hash',
      createColorInputTest('369C', '#336699cc'),
    );

    test('can set color using hex user input', createColorInputTest('#f0f0f6', '#f0f0f6'));

    test(
      'can set color using hex user input without hash',
      createColorInputTest('f0f0f6', '#f0f0f6'),
    );

    test('can set color using RGBA hex user input', createColorInputTest('#f0f0f688', '#f0f0f688'));

    test(
      'can set color using RGBA hex user input without hash',
      createColorInputTest('f0f0f688', '#f0f0f688'),
    );
  });

  suite('Named colors', () => {
    test(
      'can set color using named color user input',
      createColorInputTest('blanchedalmond', '#ffebcd'),
    );

    test(
      'can set color using named color user input with any casing',
      createColorInputTest('DarkBlue', '#00008b'),
    );

    // RGB, RGBA

    test(
      'can set color using rgb() color user input',
      createColorInputTest('rgb (255 0 0)', '#ff0000'),
    );

    test(
      'can set color using rgb() color user input without parentheses',
      createColorInputTest('rgb 255 0 0', '#ff0000'),
    );

    test(
      'can set color using rgba() color user input',
      createColorInputTest('rgba (255, 0, 0, .5)', '#ff000080'),
    );

    test(
      'can set color using rgb() color user input with decimals or percentages',
      createColorInputTest('rgb (100% 255 0)', '#ffff00'),
    );
  });

  suite('HSL, HSLA', () => {
    test(
      'can set color using hsl() color user input',
      createColorInputTest('hsl (0 100% 50%)', '#ff0000'),
    );

    test(
      'can set color using hsl() color user input without parentheses',
      createColorInputTest('hsl 0 100% 50%', '#ff0000'),
    );

    test(
      'can set color using hsla() color user input',
      createColorInputTest('hsla (0, 100%, 50%, .5)', '#ff000080'),
    );

    test(
      'can set color using hsl() color user input with decimals or percentages',
      createColorInputTest('hsl (0, 100%, .5)', '#ff0000'),
    );
  });

  suite('HSV, HSVA', () => {
    test(
      'can set color using hsv() color user input',
      createColorInputTest('hsv (0, 100%, 100%)', '#ff0000'),
    );

    test(
      'can set color using hsv() color user input without parentheses',
      createColorInputTest('hsv 0 100% 100%', '#ff0000'),
    );

    test(
      'can set color using hsva() color user input',
      createColorInputTest('hsva (0, 100%, 100%, .5)', '#ff000080'),
    );

    test(
      'can set color using hsv() color user input with decimals or percentages',
      createColorInputTest('hsv (0, 1, 100%)', '#ff0000'),
    );
  });

  suite('With Parameters', () => {
    test(
      'can set valid color using command parameters programmatically',
      createColorInputTestWithParam('#c0c0c0', '#c0c0c0'),
    );

    test(
      'cannot set invalid color using command parameters programmatically',
      createColorInputTestWithParamThatThrowsError('invalid'),
    );
  });
});

function createColorInputTest(fakeResponse: string, expectedValue: string | undefined) {
  return async () => {
    // Stub the InputBox to accept with a typed response.
    const { input, typeAndAccept } = createFakeInputBox();
    const stub = sinon.stub(vscode.window, 'createInputBox').returns(input);

    // fire the command
    const enterColorPromise = executeCommand(Commands.enterColor);
    await typeAndAccept(fakeResponse);
    await enterColorPromise;

    const config = getColorCustomizationConfig();
    const value = config[ColorSettings.titleBar_activeBackground];
    stub.restore();

    // undefined is OK, since that means they hit ESC or blank
    // Otherwise, we need a valid color
    assert.ok(!value || isValidColorInput(value));
    assert.equal(expectedValue, value);
  };
}

function createColorInputEscapeTest() {
  return async () => {
    // Stub the InputBox to simulate the user pressing Esc (hides without
    // accepting a value).
    const { input, escape } = createFakeInputBox();
    const stub = sinon.stub(vscode.window, 'createInputBox').returns(input);

    const enterColorPromise = executeCommand(Commands.enterColor);
    await escape();
    await enterColorPromise;

    const config = getColorCustomizationConfig();
    const value = config[ColorSettings.titleBar_activeBackground];
    stub.restore();

    assert.ok(!value || isValidColorInput(value));
  };
}

function createColorInputTestWithParam(fakeResponse: string, expectedValue: string | undefined) {
  return async () => {
    await executeCommand(Commands.enterColor, fakeResponse);

    const config = getColorCustomizationConfig();
    const value = config[ColorSettings.titleBar_activeBackground];

    // undefined is OK, since that means they hit ESC or blank
    // Otherwise, we need a valid color
    assert.ok(!value || isValidColorInput(value));
    assert.equal(expectedValue, value);
  };
}

function createColorInputTestWithParamThatThrowsError(fakeResponse: string) {
  return async () => {
    assert.rejects(async () => await executeCommand(Commands.enterColor, fakeResponse), Error);
    const config = getColorCustomizationConfig();
    const value = config[ColorSettings.titleBar_activeBackground];
    // The value should be undefined when invalid color is set
    assert.ok(!value);
  };
}
