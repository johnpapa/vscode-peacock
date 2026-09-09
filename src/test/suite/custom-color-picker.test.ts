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
import {
  getFavoriteColors,
  updateFavoriteColors,
  getEnvironmentAwareColor,
  getCurrentColorBeforeAdjustments,
} from '../../configuration';
import { promptForCustomColorViaColorPicker } from '../../color-picker-webview';

/**
 * Stands in for the real vscode.WebviewPanel returned by
 * vscode.window.createWebviewPanel(). Captures the message/dispose
 * listeners that color-picker-webview.ts registers so tests can simulate
 * the webview's own script posting messages back to the extension (#708).
 */
function createFakeWebviewPanel() {
  let messageListener: ((message: unknown) => unknown) | undefined;
  let disposeListener: (() => unknown) | undefined;
  let disposed = false;
  let resolveReady!: () => void;
  // Resolves once color-picker-webview.ts has wired up its message handler,
  // so tests that go through vscode.commands.executeCommand (a real,
  // potentially async round trip) know it's safe to post a message rather
  // than racing a fixed timeout.
  const ready = new Promise<void>(resolve => {
    resolveReady = resolve;
  });

  const panel = {
    webview: {
      html: '',
      onDidReceiveMessage: (listener: (message: unknown) => unknown) => {
        messageListener = listener;
        resolveReady();
        return { dispose: () => undefined };
      },
      postMessage: async () => true,
      asWebviewUri: (uri: vscode.Uri) => uri,
      cspSource: '',
    },
    onDidDispose: (listener: () => unknown) => {
      disposeListener = listener;
      return { dispose: () => undefined };
    },
    dispose: () => {
      if (disposed) {
        return;
      }
      disposed = true;
      disposeListener?.();
    },
    reveal: () => undefined,
  };

  return {
    panel: panel as unknown as vscode.WebviewPanel,
    ready,
    postToExtension: async (message: unknown) => {
      await ready;
      await messageListener?.(message);
    },
    simulateUserClosingPanel: () => panel.dispose(),
  };
}

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
