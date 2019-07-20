import * as vscode from 'vscode';
import * as assert from 'assert';
import {
  IPeacockSettings,
  ICommand,
  Commands,
  IConfiguration,
  StandardSettings,
  extensionShortName,
  AffectedSettings,
  getExtension,
  timeout,
} from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';

suite('Basic Extension Tests', () => {
  let originalValues = <IPeacockSettings>{};
  let extension: vscode.Extension<any>;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  suiteSetup(() => {
    extension = <vscode.Extension<any>>getExtension();
  });

  test('Sample Test', async () => {
    assert.equal(-1, [1, 2, 3].indexOf(5));
  });

  test('Activation test', async () => {
    await extension.activate();
    assert.equal(extension.isActive, true);
  });

  test('Extension loads in VSCode and is active', async () => {
    // Hopefully a timeout will allow the extension to activate within Windows
    // otherwise we get a false result.
    // let extension = <vscode.Extension<any>>getExtension();

    await timeout(3000);
    assert.equal(extension.isActive, true);
  });

  test('Commands exist in package.json', () => {
    // let extension = <vscode.Extension<any>>getExtension();
    const commandCollection: ICommand[] = extension.packageJSON.contributes.commands;
    for (let command in Commands) {
      const result = commandCollection.some(c => c.command === Commands[command]);
      assert.ok(result);
    }
  });

  test('Settings exist in package.json', () => {
    // let extension = <vscode.Extension<any>>getExtension();

    const config: IConfiguration = extension.packageJSON.contributes.configuration;
    const properties = Object.keys(config.properties);
    for (let setting in StandardSettings) {
      const result = properties.some(property => property === `${extensionShortName}.${StandardSettings[setting]}`);
      assert.ok(result);
    }
  });

  test('AffectedSettings exist in package.json', () => {
    // let extension = <vscode.Extension<any>>getExtension();
    const config: IConfiguration = extension.packageJSON.contributes.configuration;
    const properties = Object.keys(config.properties);
    for (let setting in AffectedSettings) {
      const result = properties.some(property => property === `${extensionShortName}.${AffectedSettings[setting]}`);
      assert.ok(result);
    }
  });

  test('package.json commands registered in extension', done => {
    // let extension = <vscode.Extension<any>>getExtension();

    const commandStrings: string[] = extension.packageJSON.contributes.commands.map((c: ICommand) => c.command);

    vscode.commands.getCommands(true).then((allCommands: string[]) => {
      const commands = allCommands.filter(c => c.startsWith(`${extensionShortName}.`));
      commands.forEach(command => {
        const result = commandStrings.some(c => c === command);
        assert.ok(result);
      });
      done();
    });
  });
});
