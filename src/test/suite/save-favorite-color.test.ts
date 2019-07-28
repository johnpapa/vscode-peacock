import * as vscode from 'vscode';
import * as assert from 'assert';
import * as sinon from 'sinon';
import { Commands, IPeacockSettings } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { executeCommand, lightenActivityBarElementAdjustments } from './lib/constants';
import {
  getFavoriteColors,
  updateElementAdjustments,
  getEnvironmentAwareColor,
} from '../../configuration';

const faveName = 'TEST FAVE NAME';

suite('Save favorite color', () => {
  let originalValues = <IPeacockSettings>{};

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

  test('with no name should not add the favorite', async () => {
    const emptyName = '';
    // Stub the async input box to return a response
    const stub = await sinon
      .stub(vscode.window, 'showInputBox')
      .returns(Promise.resolve(emptyName));

    const { values: favoriteColorsBefore } = getFavoriteColors();
    await executeCommand(Commands.saveColorToFavorites);
    const { values: favoriteColorsAfter } = getFavoriteColors();
    stub.restore();

    assert.equal(favoriteColorsBefore.length, favoriteColorsAfter.length);
    assert.ok(!favoriteColorsAfter.some(f => f.name === emptyName));
  });

  test('current color does not change', async () => {
    // activity bar is lighter than the titlebar and statusbar
    // BUT the color should not change, as we should grab the color
    // before any adjustments are made

    const currentColor = getEnvironmentAwareColor();

    // Stub the async input box to return a response
    const stub = await sinon.stub(vscode.window, 'showInputBox').returns(Promise.resolve(faveName));

    await executeCommand(Commands.saveColorToFavorites);
    stub.restore();

    const newCurrentColor = getEnvironmentAwareColor();
    // console.log(`currentColor=${currentColor} and newCurrentColor = ${newCurrentColor}`);

    assert.equal(currentColor, newCurrentColor);
  });
});
