//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

import * as vscode from 'vscode';
import * as assert from 'assert';
import * as sinon from 'sinon';
import {
  extSuffix,
  Commands,
  Settings,
  ColorSettings,
  BuiltInColors,
  Sections
} from '../constants/enums';
import {
  getAffectedElements,
  getPreferredColors,
  updateAffectedElements,
  updatePreferredColors
} from '../configuration';
import { isValidHexColor, convertNameToHex } from '../color-library';

interface ICommand {
  title: string;
  command: string;
  category: string;
}

interface IConfiguration {
  type: string;
  title: string;
  properties: any;
}

interface IPeacockSettings {
  affectedElements: string[];
  preferredColors: string[];
}

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

    originalValues.affectedElements = getAffectedElements();
    originalValues.preferredColors = getPreferredColors();

    let elements = ['statusBar', 'activityBar', 'titleBar'];
    await updateAffectedElements(elements);

    let preferredColors = ['purple', '#102030', 'dodgerblue'];
    await updatePreferredColors(preferredColors);
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
    for (let setting in Settings) {
      const result = properties.some(
        property => property === `${extSuffix}.${Settings[setting]}`
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
    assert.ok(isValidHexColor(config[ColorSettings.titleBar_activeBackground]));
  });

  test('can set color using hex user input', async function() {
    // Stub the async input box to return a response
    const fakeResponse = '#771177';
    const stub = await sinon
      .stub(vscode.window, 'showInputBox')
      .returns(Promise.resolve(fakeResponse));

    // fire the command
    await vscode.commands.executeCommand(Commands.enterColor);
    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];
    stub.restore();

    assert.ok(isValidHexColor(value));
    assert.ok(value === fakeResponse);
  });

  test('can set color using named color user input', async function() {
    // Stub the async input box to return a response
    const fakeResponse = 'purple';
    const stub = await sinon
      .stub(vscode.window, 'showInputBox')
      .returns(Promise.resolve(fakeResponse));

    // fire the command
    await vscode.commands.executeCommand(Commands.enterColor);
    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];
    stub.restore();

    assert.ok(isValidHexColor(value));
    assert.ok(value === convertNameToHex(fakeResponse));
  });

  test('can set color to preferred color', async function() {
    // Stub the async qyuick pick to return a response
    const fakeResponse = 'purple';
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    await vscode.commands.executeCommand(Commands.changeColorToPreferred);
    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];
    stub.restore();

    assert.ok(isValidHexColor(value));
    assert.ok(value === convertNameToHex(fakeResponse));
  });

  test('can reset colors', async function() {
    await vscode.commands.executeCommand(Commands.resetColors);
    let config = getPeacockWorkspaceConfig();
    assert.ok(!config[ColorSettings.titleBar_activeBackground]);
    assert.ok(!config[ColorSettings.statusBar_background]);
    assert.ok(!config[ColorSettings.activityBar_background]);
  });

  suiteTeardown(async function() {
    let config = vscode.workspace.getConfiguration();
    let value = {
      //'titleBar.activeBackground': '#ff0000'
    };
    await config.update(
      'workbench.colorCustomizations',
      value,
      vscode.ConfigurationTarget.Workspace
    );

    // put back the original peacock user settings
    await updateAffectedElements(originalValues.affectedElements);
    await updatePreferredColors(originalValues.preferredColors);
  });
});

function getPeacockWorkspaceConfig() {
  return vscode.workspace.getConfiguration(Sections.workspacePeacockSection);
}
