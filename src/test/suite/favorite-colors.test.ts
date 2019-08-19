import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as assert from 'assert';
import { IPeacockSettings, Commands, azureBlue } from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { parseFavoriteColorValue } from '../../inputs';
import { isValidColorInput } from '../../color-library';
import { executeCommand } from './lib/constants';
import {
  getFavoriteColors,
  updateFavoriteColors,
  getEnvironmentAwareColor,
} from '../../configuration';

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

  test('set to favorite color with no preferences is a noop', async () => {
    // set the color to peacock green to start
    await executeCommand(Commands.changeColorToPeacockGreen);

    // Stub the async quick pick to return a response
    const fakeResponse = '';
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    const valueBefore = getEnvironmentAwareColor();
    await executeCommand(Commands.changeColorToFavorite);
    const valueAfter = getEnvironmentAwareColor();
    stub.restore();

    assert.ok(valueBefore === valueAfter);
  });

  test('set to favorite color with no preferences is a noop, when color was not previously set', async () => {
    // Stub the async quick pick to return a response
    const fakeResponse = '';
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    const colorBefore = getEnvironmentAwareColor();
    await executeCommand(Commands.changeColorToFavorite);
    const colorAfter = getEnvironmentAwareColor();
    stub.restore();

    assert.ok(!isValidColorInput(colorAfter));
    assert.ok(colorAfter === colorBefore);
  });

  test('set to favorite color is noop when there are no favorites ', async () => {
    // set the color to peacock green to start
    await executeCommand(Commands.changeColorToPeacockGreen);

    // Stub the async quick pick to return a response
    const fakeResponse = '';
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    // Save favorites
    const { values: favoriteColors } = getFavoriteColors();
    originalValues.favoriteColors = favoriteColors;
    // Remove favorites
    await updateFavoriteColors([]);

    const colorBefore = getEnvironmentAwareColor();
    await executeCommand(Commands.changeColorToFavorite);
    const colorAfter = getEnvironmentAwareColor();
    stub.restore();

    // Put back original favorites
    await updateFavoriteColors(originalValues.favoriteColors);

    assert.ok(colorBefore && colorAfter);
    assert.ok(isValidColorInput(colorAfter), `${colorAfter} is not a valid color`);
    assert.ok(colorBefore === colorAfter);
  });
});
