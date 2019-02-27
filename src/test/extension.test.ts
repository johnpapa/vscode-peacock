//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import {
  extSuffix,
  Commands,
  Settings,
  ColorSettings,
  BuiltInColors,
  Sections
} from '../enums';
import { readConfiguration } from '../color-handlers';
import { isValidHexColor } from '../color-validators';

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

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as vscode from 'vscode';
// import * as myExtension from '../extension';

// Defines a Mocha test suite to group tests of similar kind together
suite('Extension Basic Tests', function() {
  let extension: vscode.Extension<any>;
  let originalAffectedElements: never[] | string[] = [];

  suiteSetup(async function() {
    const ext = vscode.extensions.getExtension('johnpapa.vscode-peacock');
    if (!ext) {
      throw new Error('Extension was not found.');
    }
    if (ext) {
      extension = ext;
    }

    originalAffectedElements = readConfiguration<string[]>(
      Settings.affectedElements,
      []
    );

    let config = vscode.workspace.getConfiguration();
    let value = ['statusBar', 'activityBar', 'titleBar'];
    await config.update(
      `${extSuffix}.${Settings.affectedElements}`,
      value,
      vscode.ConfigurationTarget.Global
    );
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
      const commands: string[] = allCommands.filter(c =>
        c.startsWith(`${extSuffix}.`)
      );
      commands.forEach(command => {
        const result = commandStrings.some(c => c === command);
        assert.ok(result);
      });
      done();
    });
  });

  test('can set color to Angular Red', async function() {
    await vscode.commands.executeCommand(Commands.changeColorToAngularRed);
    let config = vscode.workspace.getConfiguration(
      Sections.workspacePeacockSection
    );
    assert.equal(
      BuiltInColors.Angular,
      config[ColorSettings.titleBar_activeBackground]
    );
  });

  test('can set color to Vue Green', async function() {
    await vscode.commands.executeCommand(Commands.changeColorToVueGreen);
    let config = vscode.workspace.getConfiguration(
      Sections.workspacePeacockSection
    );
    assert.equal(
      BuiltInColors.Vue,
      config[ColorSettings.titleBar_activeBackground]
    );
  });

  test('can set color to React Blue', async function() {
    await vscode.commands.executeCommand(Commands.changeColorToReactBlue);
    let config = vscode.workspace.getConfiguration(
      Sections.workspacePeacockSection
    );
    assert.equal(
      BuiltInColors.React,
      config[ColorSettings.titleBar_activeBackground]
    );
  });

  test('can set color to Random color', async function() {
    await vscode.commands.executeCommand(Commands.changeColorToRandom);
    let config = vscode.workspace.getConfiguration(
      Sections.workspacePeacockSection
    );
    assert.ok(isValidHexColor(config[ColorSettings.titleBar_activeBackground]));
  });

  test.only('can set color using user input', async function() {
    // Stub the async input box to return a response
    const fakeResponse = '#771177';
    await sinon
      .stub(vscode.window, 'showInputBox')
      .returns(Promise.resolve(fakeResponse));

    // fire the command
    await vscode.commands.executeCommand(Commands.changeColor);
    let config = vscode.workspace.getConfiguration(
      Sections.workspacePeacockSection
    );
    const value = config[ColorSettings.titleBar_activeBackground];

    assert.ok(isValidHexColor(value));
    assert.ok(value === fakeResponse);
  });

  test('can reset colors', async function() {
    await vscode.commands.executeCommand(Commands.resetColors);
    let config = vscode.workspace.getConfiguration(
      Sections.workspacePeacockSection
    );
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
    await vscode.workspace
      .getConfiguration()
      .update(
        `${extSuffix}.${Settings.affectedElements}`,
        originalAffectedElements,
        vscode.ConfigurationTarget.Global
      );
  });
});
