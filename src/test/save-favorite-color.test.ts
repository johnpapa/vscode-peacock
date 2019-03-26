import * as vscode from 'vscode';
import * as assert from 'assert';
import * as sinon from 'sinon';
import { Commands, IPeacockSettings } from '../models';
import { allSetupAndTeardown } from './lib/setup-teardown-test-suite';
import { executeCommand } from './lib/constants';
import { getFavoriteColors } from '../configuration';

suite('Save favorite color', () => {
  let originalValues = <IPeacockSettings>{};
  allSetupAndTeardown(originalValues);

  test('with valid name', createFavoriteColorTest('Dark Dark'));

  test('with no name', createFavoriteColorTest(''));
});

function createFavoriteColorTest(name: string) {
  return async () => {
    // Stub the async input box to return a response
    const stub = await sinon
      .stub(vscode.window, 'showInputBox')
      .returns(Promise.resolve(name));

    await executeCommand(Commands.saveColorToFavorites);
    const { values: favoriteColors } = getFavoriteColors();
    stub.restore();

    assert.ok(!favoriteColors.some(f => f.name === name));
  };
}
