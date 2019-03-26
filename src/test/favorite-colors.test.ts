import vscode = require('vscode');
import sinon = require('sinon');
import { IPeacockSettings, Commands, ColorSettings } from '../models';
import { allSetupAndTeardown } from './lib/setup-teardown-test-suite';
import { parseFavoriteColorValue } from '../inputs';
import assert = require('assert');
import { isValidColorInput } from '../color-library';
import { executeCommand } from './lib/constants';
import { getPeacockWorkspaceConfig, writeRecommendedFavoriteColors } from '../configuration';

suite('Favorite colors', () => {
  let originalValues = <IPeacockSettings>{};
  allSetupAndTeardown(originalValues);

  test('can set color to favorite color', async () => {
    // Stub the async quick pick to return a response
    const fakeResponse = 'Azure Blue -> #007fff';
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    await executeCommand(Commands.changeColorToFavorite);
    let config = getPeacockWorkspaceConfig();
    const value = config[ColorSettings.titleBar_activeBackground];
    stub.restore();

    const parsedResponse = parseFavoriteColorValue(fakeResponse);

    assert.ok(isValidColorInput(value));
    assert.ok(value === parsedResponse);
  });

  test('set to favorite color with no preferences is a noop', async () => {
    // set the color to react blue to start
    await executeCommand(Commands.changeColorToReactBlue);

    // Stub the async quick pick to return a response
    const fakeResponse = '';
    const stub = await sinon
      .stub(vscode.window, 'showQuickPick')
      .returns(Promise.resolve<any>(fakeResponse));

    let config = getPeacockWorkspaceConfig();
    const valueBefore = config[ColorSettings.titleBar_activeBackground];

    await executeCommand(Commands.changeColorToFavorite);
    const valueAfter = config[ColorSettings.titleBar_activeBackground];
    stub.restore();

    assert.ok(valueBefore === valueAfter);
  });
});
