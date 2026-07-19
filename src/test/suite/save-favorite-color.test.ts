import * as vscode from 'vscode';
import * as assert from 'assert';
import * as sinon from 'sinon';
import { Commands, IPeacockSettings } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { executeCommand, lightenActivityBarElementAdjustments } from './lib/constants';
import { getFavoriteColors, updateElementAdjustments } from '../../configuration';

const faveName = 'TEST FAVE NAME';

suite('Save favorite color', () => {
  const originalValues = {} as IPeacockSettings;
  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  suiteSetup(async () => {
    await updateElementAdjustments(lightenActivityBarElementAdjustments);
  });

  setup(async () => {
    await executeCommand(Commands.changeColorToPeacockGreen);
  });

  test('with valid name successfully', async () => {
    // Stub the async input box to return a response
    const stub = await sinon.stub(vscode.window, 'showInputBox').returns(Promise.resolve(faveName));

    await executeCommand(Commands.saveColorToFavorites);
    const { values: favoriteColors } = getFavoriteColors();
    stub.restore();

    assert.ok(favoriteColors.some(f => f.name === faveName));
  });
});
