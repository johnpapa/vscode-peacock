//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

import * as vscode from 'vscode';
import * as assert from 'assert';
import * as sinon from 'sinon';
import {
  ICommand,
  IPeacockSettings,
  IConfiguration,
  IPeacockAffectedElementSettings,
  extSuffix,
  Commands,
  ColorSettings,
  StandardSettings,
  BuiltInColors,
  Sections,
  AffectedSettings,
  IPeacockElementAdjustments
} from '../models';
import {
  getAffectedElements,
  getPreferredColors,
  updateAffectedElements,
  updatePreferredColors,
  updateElementAdjustments,
  getElementStyle
} from '../configuration';
import {
  isValidColorInput,
  getLightenedColorHex,
  getDarkenedColorHex,
  getColorBrightness
} from '../color-library';
import { parsePreferredColorValue } from '../inputs';

const allAffectedElements = <IPeacockAffectedElementSettings>{
  statusBar: true,
  activityBar: true,
  titleBar: true
};

const noopElementAdjustments = <IPeacockElementAdjustments>{
  'activityBar': 'none',
  'statusBar': 'none',
  'titleBar': 'none'
};

suite('Extension Basic Tests', function() {
  let extension: vscode.Extension<any>;
  let originalValues = <IPeacockSettings>{};

  suiteSetup(async function() {
    const ext = vscode.extensions.getExtension('johnpapa.vscode-peacock');
    if (!ext) {
      throw new Error('Extension was not found.');
    }
    if (ext) {
      extension = ext;
    }

    // Save the original values
    originalValues.affectedElements = getAffectedElements();
    const { values: preferredColors } = getPreferredColors();
    originalValues.preferredColors = preferredColors;

    // Set the test values
    await updateAffectedElements(<IPeacockAffectedElementSettings>{
      statusBar: true,
      activityBar: true,
      titleBar: true
    });
    await updatePreferredColors([
      { name: 'Gatsby Purple', value: '#639' },
      { name: 'Auth0 Orange', value: '#eb5424' },
      { name: 'Azure Blue', value: '#007fff' }
    ]);
    await updateElementAdjustments(noopElementAdjustments);
  });

  setup(async function() {
    // runs before each test
    await vscode.commands.executeCommand(Commands.resetColors);
  });

  test('Extension loads in VSCode and is active', function(done) {
    // Hopefully a 200ms timeout will allow the extension to activate within Windows
    // otherwise we get a false result.
    setTimeout(function() {
      assert.equal(extension.isActive, true);
      done();
    }, 200);
  });

  test('constants.Commands exist in package.json', function() {
    const commandCollection: ICommand[] =
      extension.packageJSON.contributes.commands;
    for (let command in Commands) {
      const result = commandCollection.some(
        c => c.command === Commands[command]
      );
      assert.ok(result);
    }
  });

  test('constants.Settings exist in package.json', function() {
    const config: IConfiguration =
      extension.packageJSON.contributes.configuration;
    const properties = Object.keys(config.properties);
    for (let setting in StandardSettings) {
      const result = properties.some(
        property => property === `${extSuffix}.${StandardSettings[setting]}`
      );
      assert.ok(result);
    }
  });

  test('constants.AffectedSettings exist in package.json', function() {
    const config: IConfiguration =
      extension.packageJSON.contributes.configuration;
    const properties = Object.keys(config.properties);
    for (let setting in AffectedSettings) {
      const result = properties.some(
        property => property === `${extSuffix}.${AffectedSettings[setting]}`
      );
      assert.ok(result);
    }
  });

  test('package.json commands registered in extension', function(done) {
    const commandStrings: string[] = extension.packageJSON.contributes.commands.map(
      (c: ICommand) => c.command
    );

    vscode.commands.getCommands(true).then((allCommands: string[]) => {
      const commands = allCommands.filter(c => c.startsWith(`${extSuffix}.`));
      commands.forEach(command => {
        const result = commandStrings.some(c => c === command);
        assert.ok(result);
      });
      done();
    });
  });

  test('can set color to Angular Red', async function() {
    await vscode.commands.executeCommand(Commands.changeColorToAngularRed);
    let config = getPeacockWorkspaceConfig();
    assert.equal(
      BuiltInColors.Angular,
      config[ColorSettings.titleBar_activeBackground]
    );
  });

  test('can set color to Vue Green', async function() {
    await vscode.commands.executeCommand(Commands.changeColorToVueGreen);
    let config = getPeacockWorkspaceConfig();
    assert.equal(
      BuiltInColors.Vue,
      config[ColorSettings.titleBar_activeBackground]
    );
  });

  test('can set color to React Blue', async function() {
    await vscode.commands.executeCommand(Commands.changeColorToReactBlue);
    let config = getPeacockWorkspaceConfig();
    assert.equal(
      BuiltInColors.React,
      config[ColorSettings.titleBar_activeBackground]
    );
  });

  test('can set color to Random color', async function() {
    await vscode.commands.executeCommand(Commands.changeColorToRandom);
    let config = getPeacockWorkspaceConfig();
    assert.ok(isValidColorInput(config[ColorSettings.titleBar_activeBackground]));
  });

  test('can reset colors', async function() {
    await vscode.commands.executeCommand(Commands.resetColors);
    let config = getPeacockWorkspaceConfig();
    assert.ok(!config[ColorSettings.titleBar_activeBackground]);
    assert.ok(!config[ColorSettings.statusBar_background]);
    assert.ok(!config[ColorSettings.activityBar_background]);
  });

  suite('Enter color', function() {

    function createColorInputTest(fakeResponse: string, expectedValue: string) {
      return async function() {
        // Stub the async input box to return a response
        const stub = await sinon
          .stub(vscode.window, 'showInputBox')
          .returns(Promise.resolve(fakeResponse));

        // fire the command
        await vscode.commands.executeCommand(Commands.enterColor);
        let config = getPeacockWorkspaceConfig();
        const value = config[ColorSettings.titleBar_activeBackground];
        stub.restore();

        assert.ok(isValidColorInput(value));
        assert.equal(expectedValue, value);
      };
    }

    // Hex, Hex RGBA

    test('can set color using short hex user input',
      createColorInputTest('#000', '#000000'));

    test('can set color using short hex user input without hash',
      createColorInputTest('000', '#000000'));

    test('can set color using short RGBA hex user input',
      createColorInputTest('#369C', '#336699cc'));

    test('can set color using short RGBA hex user input without hash',
      createColorInputTest('369C', '#336699cc'));

    test('can set color using hex user input',
      createColorInputTest('#f0f0f6', '#f0f0f6'));

    test('can set color using hex user input without hash',
      createColorInputTest('f0f0f6', '#f0f0f6'));

    test('can set color using RGBA hex user input',
      createColorInputTest('#f0f0f688', '#f0f0f688'));

    test('can set color using RGBA hex user input without hash',
      createColorInputTest('f0f0f688',  '#f0f0f688'));

    // Named colors

    test('can set color using named color user input',
      createColorInputTest('blanchedalmond', '#ffebcd'));

    test('can set color using named color user input with any casing',
      createColorInputTest('DarkBlue', '#00008b'));

    // RGB, RGBA

    test('can set color using rgb() color user input',
      createColorInputTest('rgb (255 0 0)', '#ff0000'));

    test('can set color using rgb() color user input without parentheses',
      createColorInputTest('rgb 255 0 0', '#ff0000'));

    test('can set color using rgba() color user input',
      createColorInputTest('rgba (255, 0, 0, .5)', '#ff000080'));

    test('can set color using rgb() color user input with decimals or percentages',
      createColorInputTest('rgb (100% 255 0)', '#ffff00'));

    // HSL, HSLA

    test('can set color using hsl() color user input',
      createColorInputTest('hsl (0 100% 50%)', '#ff0000'));

    test('can set color using hsl() color user input without parentheses',
      createColorInputTest('hsl 0 100% 50%', '#ff0000'));

    test('can set color using hsla() color user input',
      createColorInputTest('hsla (0, 100%, 50%, .5)', '#ff000080'));

    test('can set color using hsl() color user input with decimals or percentages',
      createColorInputTest('hsl (0, 100%, .5)', '#ff0000'));

    // HSV, HSVA

    test('can set color using hsv() color user input',
      createColorInputTest('hsv (0, 100%, 100%)', '#ff0000'));

    test('can set color using hsv() color user input without parentheses',
      createColorInputTest('hsv 0 100% 100%', '#ff0000'));

    test('can set color using hsva() color user input',
      createColorInputTest('hsva (0, 100%, 100%, .5)', '#ff000080'));

    test('can set color using hsv() color user input with decimals or percentages',
      createColorInputTest('hsv (0, 1, 100%)', '#ff0000'));
  });

  suite('Preferred colors', function() {
    test('can set color to preferred color', async function() {
      // Stub the async quick pick to return a response
      const fakeResponse = 'Azure Blue -> #007fff';
      const stub = await sinon
        .stub(vscode.window, 'showQuickPick')
        .returns(Promise.resolve<any>(fakeResponse));

      await vscode.commands.executeCommand(Commands.changeColorToPreferred);
      let config = getPeacockWorkspaceConfig();
      const value = config[ColorSettings.titleBar_activeBackground];
      stub.restore();

      const parsedResponse = parsePreferredColorValue(fakeResponse);

      assert.ok(isValidColorInput(value));
      assert.ok(value === parsedResponse);
    });

    test('set to preferred color with no preferences is a noop', async function() {
      // set the color to react blue to start
      await vscode.commands.executeCommand(Commands.changeColorToReactBlue);

      // Stub the async quick pick to return a response
      const fakeResponse = '';
      const stub = await sinon
        .stub(vscode.window, 'showQuickPick')
        .returns(Promise.resolve<any>(fakeResponse));

      let config = getPeacockWorkspaceConfig();
      const valueBefore = config[ColorSettings.titleBar_activeBackground];

      await vscode.commands.executeCommand(Commands.changeColorToPreferred);
      const valueAfter = config[ColorSettings.titleBar_activeBackground];
      stub.restore();

      assert.ok(valueBefore === valueAfter);
    });
  });

  suite('Affected elements', function() {
    test('sets all color customizations for affected elements', async function() {
      await vscode.commands.executeCommand(Commands.changeColorToAngularRed);
      const config = getPeacockWorkspaceConfig();
      const style = getElementStyle(BuiltInColors.Angular);

      assert.equal(style.backgroundHex, config[ColorSettings.titleBar_activeBackground]);
      assert.equal(style.foregroundHex, config[ColorSettings.titleBar_activeForeground]);
      assert.equal(style.inactiveBackgroundHex, config[ColorSettings.titleBar_inactiveBackground]);
      assert.equal(style.inactiveForegroundHex, config[ColorSettings.titleBar_inactiveForeground]);

      assert.equal(style.backgroundHex, config[ColorSettings.activityBar_background]);
      assert.equal(style.foregroundHex, config[ColorSettings.activityBar_foreground]);
      assert.equal(style.inactiveForegroundHex, config[ColorSettings.activityBar_inactiveForeground]);

      assert.equal(style.backgroundHex, config[ColorSettings.statusBar_background]);
      assert.equal(style.foregroundHex, config[ColorSettings.statusBar_foreground]);;
    });

    test('does not set color customizations for elements not affected', async function() {
      await updateAffectedElements(<IPeacockAffectedElementSettings>{
        'activityBar': false,
        'statusBar': false
      });

      await vscode.commands.executeCommand(Commands.changeColorToAngularRed);
      const config = getPeacockWorkspaceConfig();
      const style = getElementStyle(BuiltInColors.Angular);

      assert.equal(style.backgroundHex, config[ColorSettings.titleBar_activeBackground]);
      assert.equal(style.foregroundHex, config[ColorSettings.titleBar_activeForeground]);
      assert.equal(style.inactiveBackgroundHex, config[ColorSettings.titleBar_inactiveBackground]);
      assert.equal(style.inactiveForegroundHex, config[ColorSettings.titleBar_inactiveForeground]);

      // All others should not exist
      assert.ok(!config[ColorSettings.activityBar_background]);
      assert.ok(!config[ColorSettings.activityBar_foreground]);
      assert.ok(!config[ColorSettings.activityBar_inactiveForeground]);
      assert.ok(!config[ColorSettings.statusBar_foreground]);
      assert.ok(!config[ColorSettings.statusBar_background]);

      await updateAffectedElements(allAffectedElements);
    });

    test('does not set any color customizations when no elements affected', async function() {
      await updateAffectedElements(<IPeacockAffectedElementSettings>{
        'activityBar': false,
        'statusBar': false,
        'titleBar': false
      });

      await vscode.commands.executeCommand(Commands.changeColorToAngularRed);
      let config = getPeacockWorkspaceConfig();

      assert.ok(!config[ColorSettings.titleBar_activeBackground]);
      assert.ok(!config[ColorSettings.titleBar_activeForeground]);
      assert.ok(!config[ColorSettings.titleBar_inactiveBackground]);
      assert.ok(!config[ColorSettings.titleBar_activeForeground]);
      assert.ok(!config[ColorSettings.activityBar_background]);
      assert.ok(!config[ColorSettings.activityBar_foreground]);
      assert.ok(!config[ColorSettings.activityBar_inactiveForeground]);
      assert.ok(!config[ColorSettings.statusBar_foreground]);
      assert.ok(!config[ColorSettings.statusBar_background]);

      await updateAffectedElements(allAffectedElements);
    });
  });

  suite('Element adjustments', function() {
    const elementAdjustments: IPeacockElementAdjustments = {
      'activityBar': 'lighten',
      'statusBar': 'darken',
      'titleBar': 'none'
    };

    suiteSetup(async function() {
      await updateElementAdjustments(elementAdjustments);
    });

    test('can lighten the color of an affected element', async function() {
      await vscode.commands.executeCommand(Commands.changeColorToAngularRed);
      let config = getPeacockWorkspaceConfig();
      assert.equal(
        getLightenedColorHex(BuiltInColors.Angular),
        config[ColorSettings.activityBar_background]
      );
    });

    test('can darken the color of an affected element', async function() {
      await vscode.commands.executeCommand(Commands.changeColorToAngularRed);
      let config = getPeacockWorkspaceConfig();
      assert.equal(
        getDarkenedColorHex(BuiltInColors.Angular),
        config[ColorSettings.statusBar_background]
      );
    });

    test('set adjustment to none for an affected element is noop', async function() {
      await vscode.commands.executeCommand(Commands.changeColorToAngularRed);
      let config = getPeacockWorkspaceConfig();
      assert.equal(
        BuiltInColors.Angular,
        config[ColorSettings.titleBar_activeBackground]
      );
    });

    test('set adjustment to lighten for an affected element is lighter color', async function() {
      await vscode.commands.executeCommand(Commands.changeColorToAngularRed);
      let config = getPeacockWorkspaceConfig();

      const originalBrightness = getColorBrightness(BuiltInColors.Angular);
      const adjustedBrightness = getColorBrightness(config[ColorSettings.activityBar_background]);
      assert.ok(originalBrightness < adjustedBrightness,
        `Expected original brightness ${originalBrightness} to be less than ${adjustedBrightness}, but was greater`);
    });

    test('set adjustment to darken for an affected element is darker color', async function() {
      await vscode.commands.executeCommand(Commands.changeColorToAngularRed);
      let config = getPeacockWorkspaceConfig();

      const originalBrightness = getColorBrightness(BuiltInColors.Angular);
      const adjustedBrightness = getColorBrightness(config[ColorSettings.statusBar_background]);
      assert.ok(originalBrightness > adjustedBrightness,
        `Expected original brightness ${originalBrightness} to be greater than ${adjustedBrightness}, but was less`);
    });

    test('can adjust the color of an affected elements independently', async function() {
      await vscode.commands.executeCommand(Commands.changeColorToAngularRed);
      let config = getPeacockWorkspaceConfig();
      assert.equal(
        getLightenedColorHex(BuiltInColors.Angular),
        config[ColorSettings.activityBar_background]
      );
      assert.equal(
        getDarkenedColorHex(BuiltInColors.Angular),
        config[ColorSettings.statusBar_background]
      );
      assert.equal(
        BuiltInColors.Angular,
        config[ColorSettings.titleBar_activeBackground]
      );
    });

    test('can only adjust the color of an element that is affected', async function() {
      await updateAffectedElements(<IPeacockAffectedElementSettings>{
        'activityBar': false,
        'statusBar': true,
        'titleBar': false
      });

      await vscode.commands.executeCommand(Commands.changeColorToAngularRed);
      let config = getPeacockWorkspaceConfig();

      assert.equal(
        getDarkenedColorHex(BuiltInColors.Angular),
        config[ColorSettings.statusBar_background]
      );
      assert.ok(!config[ColorSettings.activityBar_background]);
      assert.ok(!config[ColorSettings.titleBar_activeBackground]);

      await updateAffectedElements(allAffectedElements);
    });
  });

  suiteTeardown(async function() {
    await vscode.commands.executeCommand(Commands.resetColors);
    // put back the original peacock user settings
    await updateAffectedElements(originalValues.affectedElements);
    await updateElementAdjustments(originalValues.elementAdjustments);
    await updatePreferredColors(originalValues.preferredColors);
  });
});

function getPeacockWorkspaceConfig() {
  return vscode.workspace.getConfiguration(Sections.workspacePeacockSection);
}
