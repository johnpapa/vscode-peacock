import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as assert from 'assert';
import { IPeacockSettings, Commands, azureBlue } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { parseFavoriteColorValue } from '../../favorite-color';
import { isValidColorInput } from '../../color-library';
import { executeCommand } from './lib/constants';
import { getEnvironmentAwareColor } from '../../configuration';

suite('Favorite colors', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  test('can set color to favorite color', async () => {
    // Stub the async quick pick to return a response
    const fakeResponse = `Azure Blue -> ${azureBlue}`;
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    await executeCommand(Commands.changeColorToFavorite);
    const color = getEnvironmentAwareColor();
    stub.restore();

    const parsedResponse = parseFavoriteColorValue(fakeResponse);

    assert.ok(isValidColorInput(color));
    assert.ok(color === parsedResponse);
  });
});
