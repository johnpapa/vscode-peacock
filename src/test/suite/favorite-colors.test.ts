import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as assert from 'assert';
import {
  IPeacockSettings,
  Commands,
  azureBlue,
  peacockGreen,
  customColorPickerLabel,
  timeout,
} from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { parseFavoriteColorValue } from '../../favorite-color';
import { isValidColorInput } from '../../color-library';
import { executeCommand } from './lib/constants';
import {
  getFavoriteColors,
  updateFavoriteColors,
  getEnvironmentAwareColor,
  getCurrentColorBeforeAdjustments,
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

  test('highlighting "Custom color…" in the Quick Pick does not unapply the current color (#708 follow-up)', async () => {
    await executeCommand(Commands.changeColorToPeacockGreen);
    const startingColor = getCurrentColorBeforeAdjustments();
    assert.strictEqual(startingColor, peacockGreen);

    // Stub showQuickPick to capture the onDidSelectItem callback
    // promptForFavoriteColor() passes in (fired on every highlighted item,
    // not just the final selection) and hold the returned promise open
    // until the test resolves it, mirroring the real Quick Pick's
    // highlight-then-select flow.
    let onDidSelectItem: ((item: string) => unknown) | undefined;
    let resolveQuickPick!: (value: string) => void;
    const quickPickPromise = new Promise<string>(resolve => {
      resolveQuickPick = resolve;
    });
    const stub = sinon.stub(vscode.window, 'showQuickPick').callsFake(((
      _items: unknown,
      options: any,
    ) => {
      onDidSelectItem = options?.onDidSelectItem;
      return quickPickPromise;
    }) as any);

    const commandPromise = executeCommand(Commands.changeColorToFavorite);
    await timeout(50); // let promptForFavoriteColor() reach showQuickPick

    assert.ok(onDidSelectItem, 'expected showQuickPick to be called with onDidSelectItem');

    // Arrowing onto (not selecting) "Custom color…" must be a no-op: it's
    // not a favorite, so parsing it as one and applying the result used to
    // unapply every current Peacock color the instant it was highlighted.
    await onDidSelectItem!(customColorPickerLabel);
    assert.strictEqual(getCurrentColorBeforeAdjustments(), startingColor);

    // A real, parseable favorite highlighted afterward still previews
    // normally -- this fix only special-cases the picker's own entry.
    const { menu } = getFavoriteColors();
    if (menu.length > 0) {
      await onDidSelectItem!(menu[0]);
      const previewed = parseFavoriteColorValue(menu[0]);
      assert.strictEqual(getCurrentColorBeforeAdjustments(), previewed);
    }

    resolveQuickPick('');
    await commandPromise;
    stub.restore();
  });
});
