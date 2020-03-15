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
  const originalValues = {} as IPeacockSettings;
  let extension: vscode.Extension<any>;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  suiteSetup(() => {
    extension = getExtension() as vscode.Extension<any>;
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
    // let extension = getExtension() as vscode.Extension<any>;

    await timeout(3000);
    assert.equal(extension.isActive, true);
  });

  test('Commands exist in package.json', () => {
    // let extension = getExtension() as vscode.Extension<any>;
    const commandCollection: ICommand[] = extension.packageJSON.contributes.commands;
    const indexedCommands: { [idx: string]: Commands } = Commands as any;
    for (const command in Commands) {
      const result = commandCollection.some(c => c.command === indexedCommands[command]);
      assert.ok(result);
    }
  });

  test.only('Settings exist in package.json', () => {
    // let extension = getExtension() as vscode.Extension<any>;

    const config: IConfiguration = extension.packageJSON.contributes.configuration;
    const properties = Object.keys(config.properties);
    const indexedSettings: { [idx: string]: StandardSettings } = StandardSettings as any;
    for (const setting in StandardSettings) {
      const result = properties.some(
        property => property === `${extensionShortName}.${indexedSettings[setting]}`,
      );
      assert.ok(result);
    }
  });

  test('AffectedSettings exist in package.json', () => {
    // let extension = getExtension() as vscode.Extension<any>;
    const config: IConfiguration = extension.packageJSON.contributes.configuration;
    const properties = Object.keys(config.properties);
    const indexedSettings: { [idx: string]: AffectedSettings } = AffectedSettings as any;
    for (const setting in AffectedSettings) {
      const result = properties.some(
        property => property === `${extensionShortName}.${indexedSettings[setting]}`,
      );
      assert.ok(result);
    }
  });

  test('package.json commands registered in extension', done => {
    // let extension = getExtension() as vscode.Extension<any>;

    const commandStrings: string[] = extension.packageJSON.contributes.commands.map(
      (c: ICommand) => c.command,
    );

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
