import * as vscode from 'vscode';
import * as assert from 'assert';
import * as sinon from 'sinon';
import { getPeacockWorkspaceConfig } from './lib/helpers';
import { ColorSettings, Commands, IPeacockSettings } from '../models';
import { isValidColorInput } from '../color-library';
import { allSetupAndTeardown } from './lib/setup-teardown-test-suite';
import { executeCommand } from './lib/constants';

suite('Enter color', () => {
  let originalValues = <IPeacockSettings>{};
  allSetupAndTeardown(originalValues);

  suite('Hex, Hex RGBA', () => {
    test(
      'can set color using short hex user input',
      createColorInputTest('#000', '#000000')
    );

    test(
      'can set color using short hex user input without hash',
      createColorInputTest('000', '#000000')
    );

    test(
      'can set color using short RGBA hex user input',
      createColorInputTest('#369C', '#336699cc')
    );

    test(
      'can set color using short RGBA hex user input without hash',
      createColorInputTest('369C', '#336699cc')
    );

    test(
      'can set color using hex user input',
      createColorInputTest('#f0f0f6', '#f0f0f6')
    );

    test(
      'can set color using hex user input without hash',
      createColorInputTest('f0f0f6', '#f0f0f6')
    );

    test(
      'can set color using RGBA hex user input',
      createColorInputTest('#f0f0f688', '#f0f0f688')
    );

    test(
      'can set color using RGBA hex user input without hash',
      createColorInputTest('f0f0f688', '#f0f0f688')
    );
  });

  suite('Named colors', () => {
    test(
      'can set color using named color user input',
      createColorInputTest('blanchedalmond', '#ffebcd')
    );

    test(
      'can set color using named color user input with any casing',
      createColorInputTest('DarkBlue', '#00008b')
    );

    // RGB, RGBA

    test(
      'can set color using rgb() color user input',
      createColorInputTest('rgb (255 0 0)', '#ff0000')
    );

    test(
      'can set color using rgb() color user input without parentheses',
      createColorInputTest('rgb 255 0 0', '#ff0000')
    );

    test(
      'can set color using rgba() color user input',
      createColorInputTest('rgba (255, 0, 0, .5)', '#ff000080')
    );

    test(
      'can set color using rgb() color user input with decimals or percentages',
      createColorInputTest('rgb (100% 255 0)', '#ffff00')
    );
  });

  suite('HSL, HSLA', () => {
    test(
      'can set color using hsl() color user input',
      createColorInputTest('hsl (0 100% 50%)', '#ff0000')
    );

    test(
      'can set color using hsl() color user input without parentheses',
      createColorInputTest('hsl 0 100% 50%', '#ff0000')
    );

    test(
      'can set color using hsla() color user input',
      createColorInputTest('hsla (0, 100%, 50%, .5)', '#ff000080')
    );

    test(
      'can set color using hsl() color user input with decimals or percentages',
      createColorInputTest('hsl (0, 100%, .5)', '#ff0000')
    );
  });

  suite('HSV, HSVA', () => {
    test(
      'can set color using hsv() color user input',
      createColorInputTest('hsv (0, 100%, 100%)', '#ff0000')
    );

    test(
      'can set color using hsv() color user input without parentheses',
      createColorInputTest('hsv 0 100% 100%', '#ff0000')
    );

    test(
      'can set color using hsva() color user input',
      createColorInputTest('hsva (0, 100%, 100%, .5)', '#ff000080')
    );

    test(
      'can set color using hsv() color user input with decimals or percentages',
      createColorInputTest('hsv (0, 1, 100%)', '#ff0000')
    );
  });
});

function createColorInputTest(fakeResponse: string, expectedValue: string) {
  return async () => {
    // Stub the async input box to return a response
    const stub = await sinon
      .stub(vscode.window, 'showInputBox')
      .returns(Promise.resolve(fakeResponse));

    // fire the command
    await executeCommand(Commands.enterColor);
    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];
    stub.restore();

    assert.ok(isValidColorInput(value));
    assert.equal(expectedValue, value);
  };
}
