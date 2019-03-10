import * as vscode from 'vscode';
import * as assert from 'assert';
import * as sinon from 'sinon';
import { Commands, IPeacockSettings } from '../models';
import { allSetupAndTeardown } from './lib/setup-teardown-test-suite';
import { executeCommand } from './lib/constants';
import { getPreferredColors } from '../configuration';

suite('Save preferred color', () => {
  let originalValues = <IPeacockSettings>{};
  allSetupAndTeardown(originalValues);

  test('with valid name', createPreferredColorTest('Dark Dark'));

  test('with no name', createPreferredColorTest(''));
});

function createPreferredColorTest(name: string) {
  return async () => {
    // Stub the async input box to return a response
    const stub = await sinon
      .stub(vscode.window, 'showInputBox')
      .returns(Promise.resolve(name));

    // fire the command
    await executeCommand(Commands.saveColor);
    const { values: preferredColors } = getPreferredColors();
    stub.restore();

    assert.ok(!preferredColors.some(pc => pc.name === name));
  };
}
