import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as assert from 'assert';
import {
  IPeacockSettings,
  Commands,
  azureBlue,
  peacockGreen,
  customColorPickerLabel,
} from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import { executeCommand } from './lib/constants';
import { createFakeWebviewPanel } from './lib/fake-webview-panel';
import {
  getFavoriteColors,
  updateFavoriteColors,
  getEnvironmentAwareColor,
  getCurrentColorBeforeAdjustments,
} from '../../configuration';
import { promptForCustomColorViaColorPicker } from '../../color-picker-webview';

suite('Custom color picker (#708)', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  suite('promptForCustomColorViaColorPicker', () => {
    test('every preview message applies the color live', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);

      const { panel, postToExtension } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      const resultPromise = promptForCustomColorViaColorPicker(peacockGreen);
      await postToExtension({ type: 'preview', color: azureBlue });

      assert.strictEqual(getCurrentColorBeforeAdjustments(), azureBlue);

      await postToExtension({ type: 'apply', color: azureBlue });
      await resultPromise;

      createPanelStub.restore();
    });

    test('resolves with the applied color and leaves it applied', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);

      const { panel, postToExtension } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      const resultPromise = promptForCustomColorViaColorPicker(peacockGreen);
      // A real edit always previews first (the color well/hex "input" event
      // fires before Apply is clickable in a meaningful sense); mirror that
      // here so the color customization actually reflects the chosen color.
      await postToExtension({ type: 'preview', color: azureBlue });
      await postToExtension({ type: 'apply', color: azureBlue });
      const result = await resultPromise;

      createPanelStub.restore();

      assert.strictEqual(result, azureBlue);
      assert.strictEqual(getCurrentColorBeforeAdjustments(), azureBlue);
    });

    test('canceling reverts to the color that was active before the picker opened', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const startingColor = getEnvironmentAwareColor();

      const { panel, postToExtension } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      const resultPromise = promptForCustomColorViaColorPicker(startingColor);
      await postToExtension({ type: 'preview', color: azureBlue });
      assert.strictEqual(getCurrentColorBeforeAdjustments(), azureBlue);

      await postToExtension({ type: 'cancel' });
      const result = await resultPromise;

      createPanelStub.restore();

      assert.strictEqual(result, '');
      assert.strictEqual(getCurrentColorBeforeAdjustments(), startingColor);
    });

    test('closing the panel without applying reverts to the starting color', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const startingColor = getEnvironmentAwareColor();

      const { panel, postToExtension, simulateUserClosingPanel } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      const resultPromise = promptForCustomColorViaColorPicker(startingColor);
      await postToExtension({ type: 'preview', color: azureBlue });

      simulateUserClosingPanel();
      const result = await resultPromise;

      createPanelStub.restore();

      assert.strictEqual(result, '');
      assert.strictEqual(getCurrentColorBeforeAdjustments(), startingColor);
    });

    test('ignores an invalid preview/apply color rather than applying it', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const startingColor = getEnvironmentAwareColor();

      const { panel, postToExtension } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      const resultPromise = promptForCustomColorViaColorPicker(startingColor);
      await postToExtension({ type: 'preview', color: 'not-a-color' });
      assert.strictEqual(getCurrentColorBeforeAdjustments(), startingColor);

      await postToExtension({ type: 'cancel' });
      await resultPromise;

      createPanelStub.restore();
    });

    test("posts a title bar contrast preview matching Peacock's own applyColor() pairing (#708 follow-up)", async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);

      const { panel, postedMessages, postToExtension } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      const resultPromise = promptForCustomColorViaColorPicker(peacockGreen);
      // One contrast message should already have been posted for the
      // starting color as soon as the panel opened...
      assert.ok(
        postedMessages.some(
          (message: any) => message.type === 'contrast' && message.backgroundHex === peacockGreen,
        ),
      );

      // ...and previewing a new (light) color should post an updated
      // contrast pairing for *that* color -- proving the preview swatch
      // can never silently drift out of sync with what's actually applied.
      await postToExtension({ type: 'preview', color: '#ffa500' });
      const orangeContrast: any = postedMessages.find(
        (message: any) => message.type === 'contrast' && message.backgroundHex === '#ffa500',
      );
      assert.ok(orangeContrast, 'expected a contrast update for the previewed orange color');
      assert.strictEqual(orangeContrast.foregroundHex, '#15202b');
      assert.strictEqual(orangeContrast.isReadable, true);

      await postToExtension({ type: 'cancel' });
      await resultPromise;

      createPanelStub.restore();
    });
  });

  suite('enterColor command with no argument (#708 follow-up: merged with visual picker)', () => {
    test('opens the picker directly and applies/persists the chosen color', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);

      const { panel, postToExtension } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      const commandPromise = executeCommand(Commands.enterColor);
      await postToExtension({ type: 'preview', color: azureBlue });
      await postToExtension({ type: 'apply', color: azureBlue });
      await commandPromise;

      createPanelStub.restore();

      assert.strictEqual(getEnvironmentAwareColor(), azureBlue);
      const { values: favoriteColors } = getFavoriteColors();
      // updateColorSetting() only writes a favorite for a name match; this
      // just confirms the command didn't blow up interacting with settings.
      assert.ok(Array.isArray(favoriteColors));
    });

    test('canceling reverts to the color active before it ran', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const startingColor = getEnvironmentAwareColor();

      const { panel, postToExtension } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      const commandPromise = executeCommand(Commands.enterColor);
      await postToExtension({ type: 'preview', color: azureBlue });
      await postToExtension({ type: 'cancel' });
      await commandPromise;

      createPanelStub.restore();

      assert.strictEqual(getEnvironmentAwareColor(), startingColor);
    });
  });

  suite('Favorites Quick Pick integration', () => {
    test('offers Custom color… even when there are no favorites saved', async () => {
      const { values: favoriteColors } = getFavoriteColors();
      await updateFavoriteColors([]);

      let offeredItems: string[] = [];
      const quickPickStub = (sinon.stub(vscode.window, 'showQuickPick') as any).callsFake(
        async (items: string[]) => {
          offeredItems = items;
          return '';
        },
      );

      await executeCommand(Commands.changeColorToFavorite);

      quickPickStub.restore();
      await updateFavoriteColors(favoriteColors);

      assert.ok(offeredItems.includes(customColorPickerLabel));
    });

    test('selecting Custom color… opens the picker and persists the applied color', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);

      const quickPickStub = sinon
        .stub(vscode.window, 'showQuickPick')
        .returns(Promise.resolve<any>(customColorPickerLabel));
      const { panel, postToExtension } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      const commandPromise = executeCommand(Commands.changeColorToFavorite);
      await postToExtension({ type: 'apply', color: azureBlue });
      await commandPromise;

      quickPickStub.restore();
      createPanelStub.restore();

      assert.strictEqual(getEnvironmentAwareColor(), azureBlue);
    });

    test('canceling Custom color… from the Quick Pick flow reverts to the starting color', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const startingColor = getEnvironmentAwareColor();

      const quickPickStub = sinon
        .stub(vscode.window, 'showQuickPick')
        .returns(Promise.resolve<any>(customColorPickerLabel));
      const { panel, postToExtension } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      const commandPromise = executeCommand(Commands.changeColorToFavorite);
      await postToExtension({ type: 'preview', color: azureBlue });
      await postToExtension({ type: 'cancel' });
      await commandPromise;

      quickPickStub.restore();
      createPanelStub.restore();

      assert.strictEqual(getEnvironmentAwareColor(), startingColor);
    });
  });
});
