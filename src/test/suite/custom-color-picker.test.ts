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
import { executeCommand, allAffectedElements } from './lib/constants';
import { createFakeWebviewPanel } from './lib/fake-webview-panel';
import {
  getFavoriteColors,
  updateFavoriteColors,
  getEnvironmentAwareColor,
  getCurrentColorBeforeAdjustments,
  updateAffectedElements,
  updateKeepForegroundColor,
} from '../../configuration';
import {
  promptForCustomColorViaColorPicker,
  PREVIEW_APPLY_DEBOUNCE_MS,
} from '../../color-picker-webview';
import * as applyColorModule from '../../apply-color';

// A little longer than the debounce delay so real-time waits in tests are
// never flaky against the timer actually firing.
const DEBOUNCE_SETTLE_WAIT_MS = PREVIEW_APPLY_DEBOUNCE_MS + 150;

suite('Custom color picker (#708)', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  suite('promptForCustomColorViaColorPicker', () => {
    test('a single preview does not apply the color immediately, but does apply it once the debounce delay settles (#776 follow-up: live preview without the drag performance hit)', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const startingColor = getCurrentColorBeforeAdjustments();

      const { panel, postToExtension } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      const resultPromise = promptForCustomColorViaColorPicker(peacockGreen);
      await postToExtension({ type: 'preview', color: azureBlue });

      // Immediately after the event, nothing has been written yet -- only
      // the panel's own contrast swatch updated synchronously.
      assert.strictEqual(getCurrentColorBeforeAdjustments(), startingColor);

      // Once the debounce delay elapses with no further events, the
      // previewed color IS applied to the real workbench -- this is what
      // lets the user see their actual title bar/status bar update while
      // picking, not just the panel's own preview swatch.
      await new Promise(resolve => setTimeout(resolve, DEBOUNCE_SETTLE_WAIT_MS));
      assert.strictEqual(getCurrentColorBeforeAdjustments(), azureBlue);

      await postToExtension({ type: 'apply', color: azureBlue });
      await resultPromise;

      createPanelStub.restore();

      assert.strictEqual(getCurrentColorBeforeAdjustments(), azureBlue);
    });

    test('Apply commits the previewed color immediately, without waiting for the debounce delay (#776 follow-up)', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);

      const { panel, postToExtension } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      const resultPromise = promptForCustomColorViaColorPicker(peacockGreen);
      await postToExtension({ type: 'preview', color: azureBlue });
      // Apply right away -- well before PREVIEW_APPLY_DEBOUNCE_MS elapses.
      await postToExtension({ type: 'apply', color: azureBlue });
      const result = await resultPromise;

      createPanelStub.restore();

      assert.strictEqual(result, azureBlue);
      assert.strictEqual(getCurrentColorBeforeAdjustments(), azureBlue);
    });

    test('a rapid burst of preview messages (simulating a color-well/eyedropper drag) collapses into a single applied write once the burst settles, not one write per event (#776 follow-up: performance)', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);

      const { panel, postToExtension } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);
      const applyColorSpy = sinon.spy(applyColorModule, 'applyColor');

      const resultPromise = promptForCustomColorViaColorPicker(peacockGreen);

      // Simulate a drag: many preview events in quick succession, each one
      // resetting the debounce timer before the previous one could fire --
      // this is exactly the pattern that made VS Code slow down pre-#776,
      // since every one of these used to call applyColor() immediately.
      const dragColors = Array.from(
        { length: 40 },
        (_, i) => `#${i.toString(16).padStart(6, '0')}`,
      );
      for (const color of dragColors) {
        await postToExtension({ type: 'preview', color });
      }

      // While events are still arriving (or have only just stopped), no
      // write should have happened yet.
      assert.strictEqual(
        applyColorSpy.callCount,
        0,
        'no write should happen while the burst is still in progress',
      );

      // Let the debounce settle.
      await new Promise(resolve => setTimeout(resolve, DEBOUNCE_SETTLE_WAIT_MS));

      // The whole 40-event burst must collapse into exactly one write, with
      // the *last* previewed color -- not 40 writes, and not an
      // intermediate color from partway through the drag.
      assert.strictEqual(
        applyColorSpy.callCount,
        1,
        'a burst of preview events must collapse into a single debounced write',
      );
      assert.strictEqual(applyColorSpy.firstCall.args[0], dragColors[dragColors.length - 1]);
      assert.strictEqual(getCurrentColorBeforeAdjustments(), dragColors[dragColors.length - 1]);

      await postToExtension({ type: 'cancel' });
      await resultPromise;

      createPanelStub.restore();
      applyColorSpy.restore();
    });

    test('canceling before the debounce delay settles cancels the pending write, leaving the starting color untouched', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const startingColor = getEnvironmentAwareColor();

      const { panel, postToExtension } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      const resultPromise = promptForCustomColorViaColorPicker(startingColor);
      await postToExtension({ type: 'preview', color: azureBlue });
      assert.strictEqual(getCurrentColorBeforeAdjustments(), startingColor);

      // Cancel right away -- well before the debounce delay would have
      // applied the previewed color.
      await postToExtension({ type: 'cancel' });
      const result = await resultPromise;

      // Waiting out the delay afterwards must not retroactively apply the
      // canceled preview -- cancel() must have actually dropped the
      // pending timer, not just raced it.
      await new Promise(resolve => setTimeout(resolve, DEBOUNCE_SETTLE_WAIT_MS));

      createPanelStub.restore();

      assert.strictEqual(result, '');
      assert.strictEqual(getCurrentColorBeforeAdjustments(), startingColor);
    });

    test('canceling after the debounce delay already applied a preview reverts to the starting color', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const startingColor = getEnvironmentAwareColor();

      const { panel, postToExtension } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      const resultPromise = promptForCustomColorViaColorPicker(startingColor);
      await postToExtension({ type: 'preview', color: azureBlue });

      await new Promise(resolve => setTimeout(resolve, DEBOUNCE_SETTLE_WAIT_MS));
      assert.strictEqual(getCurrentColorBeforeAdjustments(), azureBlue);

      await postToExtension({ type: 'cancel' });
      const result = await resultPromise;

      createPanelStub.restore();

      assert.strictEqual(result, '');
      assert.strictEqual(getCurrentColorBeforeAdjustments(), startingColor);
    });

    test('an in-flight debounced preview write is never raced by Apply or Cancel (#776 follow-up: debouncing must not drop the serialization guarantee)', async () => {
      // applyColor() is a read-modify-write of workbench.colorCustomizations,
      // so two overlapping calls can let an earlier color's write land after
      // a later one's. Every message used to go through serializeMessageHandler,
      // which guaranteed that never happened. Debouncing moves the preview's
      // write off that queue and onto a timer, so a debounced write that has
      // already fired can still be in flight when the user clicks Apply or
      // Cancel -- without a shared serializer, those two applyColor() calls
      // overlap and the final (Apply/Cancel) write can be clobbered by the
      // stale preview finishing last.
      await executeCommand(Commands.changeColorToPeacockGreen);

      const order: string[] = [];
      const applyColorStub = sinon
        .stub(applyColorModule, 'applyColor')
        .callsFake(async (input: string) => {
          order.push(`start:${input}`);
          // Long enough that a non-serialized Apply would definitely start
          // before this resolves.
          await new Promise(resolve => setTimeout(resolve, 60));
          order.push(`end:${input}`);
          return input;
        });

      const { panel, postToExtension } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      const resultPromise = promptForCustomColorViaColorPicker(peacockGreen);
      await postToExtension({ type: 'preview', color: azureBlue });

      // Wait just past the debounce so the preview's write has *started* but
      // is still in flight (it takes 60ms), then commit a different color.
      await new Promise(resolve => setTimeout(resolve, PREVIEW_APPLY_DEBOUNCE_MS + 10));
      await postToExtension({ type: 'apply', color: peacockGreen });
      await resultPromise;

      createPanelStub.restore();
      applyColorStub.restore();

      // Strictly serialized: the preview write completes before the Apply
      // write begins. Interleaved output like
      // ['start:azure', 'start:green', 'end:azure', 'end:green'] means the
      // two writes overlapped and Apply could be clobbered.
      assert.deepStrictEqual(order, [
        `start:${azureBlue}`,
        `end:${azureBlue}`,
        `start:${peacockGreen}`,
        `end:${peacockGreen}`,
      ]);
    });

    test('canceling after the debounce delay already applied a preview unapplies the color when there was no starting color, rather than leaving the preview applied', async () => {
      // Regression test: when the picker is opened with no color set yet
      // (e.g. a fresh workspace, startingColor === ''), onCancel must still
      // revert a preview that the debounce already wrote to the workbench.
      // A naive `if (startingColor) { await applyColor(startingColor); }`
      // guard skips the revert entirely for a falsy startingColor, leaving
      // the previewed color permanently applied even though the user
      // canceled.
      await executeCommand(Commands.resetWorkspaceColors);
      const startingColor = getEnvironmentAwareColor();
      assert.strictEqual(startingColor, '');

      const { panel, postToExtension } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      const resultPromise = promptForCustomColorViaColorPicker(startingColor);
      await postToExtension({ type: 'preview', color: azureBlue });

      await new Promise(resolve => setTimeout(resolve, DEBOUNCE_SETTLE_WAIT_MS));
      assert.strictEqual(getCurrentColorBeforeAdjustments(), azureBlue);

      await postToExtension({ type: 'cancel' });
      const result = await resultPromise;

      createPanelStub.restore();

      assert.strictEqual(result, '');
      assert.strictEqual(getEnvironmentAwareColor(), '');
    });

    test('closing the panel without applying leaves the starting color untouched when closed before the debounce settles', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const startingColor = getEnvironmentAwareColor();

      const { panel, postToExtension, simulateUserClosingPanel } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      const resultPromise = promptForCustomColorViaColorPicker(startingColor);
      await postToExtension({ type: 'preview', color: azureBlue });

      simulateUserClosingPanel();
      const result = await resultPromise;

      await new Promise(resolve => setTimeout(resolve, DEBOUNCE_SETTLE_WAIT_MS));

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

      await new Promise(resolve => setTimeout(resolve, DEBOUNCE_SETTLE_WAIT_MS));
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
      // Under the default settings (peacock.affectTitleBar: true,
      // peacock.keepForegroundColor: false) this exact pairing IS what
      // Peacock will apply (#755 code-review follow-up).
      assert.strictEqual(orangeContrast.titleBarAffected, true);
      assert.strictEqual(orangeContrast.foregroundApplied, true);

      await postToExtension({ type: 'cancel' });
      await resultPromise;

      createPanelStub.restore();
    });

    test('flags the contrast preview as not applied when peacock.affectTitleBar/keepForegroundColor make it inaccurate (#755 code-review follow-up)', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const originalAffectedElements = { ...allAffectedElements };

      await updateAffectedElements({ ...allAffectedElements, titleBar: false });

      const { panel, postedMessages, postToExtension } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      const resultPromise = promptForCustomColorViaColorPicker(peacockGreen);
      await postToExtension({ type: 'preview', color: '#ffa500' });
      const withTitleBarOff: any = postedMessages.find(
        (message: any) => message.type === 'contrast' && message.backgroundHex === '#ffa500',
      );
      assert.ok(withTitleBarOff, 'expected a contrast update for the previewed orange color');
      // affectTitleBar off means Peacock won't touch the title bar at
      // all, so neither the background nor the computed foreground will
      // actually be applied -- the preview must say so rather than
      // implying a guarantee that doesn't hold.
      assert.strictEqual(withTitleBarOff.titleBarAffected, false);
      assert.strictEqual(withTitleBarOff.foregroundApplied, false);

      await postToExtension({ type: 'cancel' });
      await resultPromise;
      createPanelStub.restore();

      await updateAffectedElements({ ...allAffectedElements, titleBar: true });
      await updateKeepForegroundColor(true);

      const {
        panel: panel2,
        postedMessages: postedMessages2,
        postToExtension: postToExtension2,
      } = createFakeWebviewPanel();
      const createPanelStub2 = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel2);

      const resultPromise2 = promptForCustomColorViaColorPicker(peacockGreen);
      await postToExtension2({ type: 'preview', color: '#ffa500' });
      const withForegroundKept: any = postedMessages2.find(
        (message: any) => message.type === 'contrast' && message.backgroundHex === '#ffa500',
      );
      assert.ok(withForegroundKept, 'expected a contrast update for the previewed orange color');
      // keepForegroundColor on means only the background gets applied --
      // the title bar itself is still affected, but the foreground pairing
      // shown is only a preview, not something Peacock will write.
      assert.strictEqual(withForegroundKept.titleBarAffected, true);
      assert.strictEqual(withForegroundKept.foregroundApplied, false);

      await postToExtension2({ type: 'cancel' });
      await resultPromise2;
      createPanelStub2.restore();

      await updateAffectedElements(originalAffectedElements);
      await updateKeepForegroundColor(false);
    });

    test("posts the picker's own fallback color (peacockGreen) as the initial contrast preview when there's no starting color to resolve (#708 follow-up)", async () => {
      const { panel, postedMessages, postToExtension } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      // '' is what getEnvironmentAwareColor() returns when no
      // peacock.color/remoteColor is set yet -- getColorPickerHtml('')
      // falls back to peacockGreen for the well/hex field, and the
      // initial contrast preview must be computed from that same
      // resolved color, not from '' (which would compute a black
      // background/light-foreground pairing that has nothing to do with
      // what the picker actually shows).
      const resultPromise = promptForCustomColorViaColorPicker('');

      const initialContrast: any = postedMessages.find(
        (message: any) => message.type === 'contrast',
      );
      assert.ok(initialContrast, 'expected an initial contrast message');
      assert.strictEqual(initialContrast.backgroundHex, peacockGreen);

      await postToExtension({ type: 'cancel' });
      await resultPromise;

      createPanelStub.restore();
    });

    test('closing the panel while a preview is still debouncing does not throw (#708 follow-up: dispose race)', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const startingColor = getEnvironmentAwareColor();

      const { panel, postToExtension, simulateUserClosingPanel } = createFakeWebviewPanel();
      const createPanelStub = sinon.stub(vscode.window, 'createWebviewPanel').returns(panel);

      const resultPromise = promptForCustomColorViaColorPicker(startingColor);

      // Deliberately don't await this preview -- it's still queued/in
      // flight when the panel closes right after, mirroring a color-well
      // drag event landing at the same moment the user clicks the tab's
      // close button.
      const previewPromise = postToExtension({ type: 'preview', color: azureBlue });
      simulateUserClosingPanel();

      // Whichever of the two queued messages the shared message queue
      // happens to run second, it must not throw (a queued preview's own
      // contrast-preview post, once the panel is disposed, is silently
      // skipped rather than throwing "Webview is disposed" -- an unhandled
      // rejection since nothing awaits that post). Closing cancels the
      // pending debounced write, so waiting out the delay afterwards must
      // not retroactively apply the preview that was in flight when the
      // panel closed.
      await assert.doesNotReject(previewPromise);
      const result = await resultPromise;

      await new Promise(resolve => setTimeout(resolve, DEBOUNCE_SETTLE_WAIT_MS));

      createPanelStub.restore();

      assert.strictEqual(result, '');
      assert.strictEqual(getCurrentColorBeforeAdjustments(), startingColor);
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
