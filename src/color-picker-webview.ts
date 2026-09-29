import * as vscode from 'vscode';
import { applyColor } from './apply-color';
import {
  createColorPickerMessageHandler,
  getColorPickerHtml,
  resolveInitialColor,
  serializeMessageHandler,
  ColorPickerContrastUpdate,
} from './color-picker-html';
import { getTitleBarContrastPreview } from './color-picker-contrast';
import { isAffectedSettingSelected, getKeepForegroundColor } from './configuration';
import { AffectedSettings } from './models';

export { getColorPickerHtml } from './color-picker-html';
export type { ColorPickerMessage, ColorPickerCallbacks } from './color-picker-html';

/**
 * Opens the picker as a webview panel and resolves to the applied hex color,
 * or '' if the user canceled. Every color-well/hex edit only updates the
 * panel's own title-bar contrast preview swatch (a cheap, in-memory
 * computation) -- Peacock itself is left untouched, and workbench colors
 * are only ever written once, when Apply is clicked. Dragging the native
 * color well fires an 'input' event on essentially every pixel of
 * movement; previously each of those called applyColor(), which writes
 * workbench.colorCustomizations to settings.json and triggers a workbench
 * theme re-render, and doing that continuously while dragging made VS Code
 * visibly slow down (#776). Canceling (or closing the panel) needs no
 * revert now, since nothing was ever applied to revert.
 */
export async function promptForCustomColorViaColorPicker(startingColor: string): Promise<string> {
  return new Promise<string>(resolve => {
    const panel = vscode.window.createWebviewPanel(
      'peacockCustomColorPicker',
      'Peacock: Custom Color',
      { viewColumn: vscode.ViewColumn.Active, preserveFocus: false },
      // retainContextWhenHidden keeps the webview's own script/DOM alive
      // (and its acquireVsCodeApi() state) while the panel is hidden --
      // e.g. the user switches to another editor tab to compare colors,
      // then comes back. Without it, VS Code discards and later rebuilds
      // the webview from panel.webview.html, resetting the well/hex field
      // back to startingColor even though the workspace still shows
      // whatever was last previewed, and silently dropping the one-time
      // initial contrast message this function already sent (#708
      // follow-up). The panel is tiny, so the extra memory cost is
      // negligible.
      { enableScripts: true, retainContextWhenHidden: true },
    );

    let settled = false;
    let disposed = false;
    const finish = (result: string) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(result);
      panel.dispose();
    };

    // Posting to a disposed webview throws ("Webview is disposed"). A
    // message queued (see handleMessage below) before the panel closed can
    // still be running its handler after onDidDispose has already fired,
    // so every post to the webview needs this guard, not just the initial
    // one (#708 follow-up).
    const safePostMessage = (message: ColorPickerContrastUpdate | { type: 'invalid' }) => {
      if (disposed) {
        return;
      }
      panel.webview.postMessage(message);
    };

    /**
     * Posts the title bar background/foreground pairing Peacock would apply
     * for `color` down to the webview so its contrast preview swatch stays
     * in sync with the same logic applyColor() just used -- never a
     * separate, reimplemented copy of it (#708 follow-up). Reads the same
     * peacock.affectTitleBar / peacock.keepForegroundColor settings
     * collectTitleBarSettings() gates on (read fresh on every preview, not
     * cached, since the user could flip either mid-session) so the preview
     * can flag when this exact pairing won't actually be applied, instead
     * of implying a guarantee prepareColors() itself doesn't honor.
     */
    const postContrastPreview = (color: string) => {
      const preview = getTitleBarContrastPreview(color, {
        titleBarAffected: isAffectedSettingSelected(AffectedSettings.TitleBar),
        keepForegroundColor: getKeepForegroundColor(),
      });
      const message: ColorPickerContrastUpdate = {
        type: 'contrast',
        backgroundHex: preview.backgroundHex,
        foregroundHex: preview.foregroundHex,
        ratio: preview.ratio,
        isReadable: preview.isReadable,
        titleBarAffected: preview.titleBarAffected,
        foregroundApplied: preview.foregroundApplied,
      };
      safePostMessage(message);
    };

    panel.webview.html = getColorPickerHtml(startingColor);
    // Post the *same* resolved color getColorPickerHtml() actually rendered
    // -- not the raw, possibly empty/invalid startingColor -- so the
    // initial contrast preview can't show black-on-white under a green
    // well when there's no peacock.color set yet (#708 follow-up).
    postContrastPreview(resolveInitialColor(startingColor));

    const rawHandleMessage = createColorPickerMessageHandler({
      onPreview: async color => {
        // No applyColor() here (#776) -- a preview only updates the
        // panel's own contrast swatch, which is a pure, in-memory
        // computation with no workbench/settings write, so a rapid burst
        // of these while dragging the color well can't slow VS Code down.
        // The `settled` check still matters: a still-in-flight preview
        // from just before Apply/Cancel/close must not post a
        // contrast-swatch update for a panel that's already resolved.
        if (settled) {
          return;
        }
        postContrastPreview(color);
      },
      onApply: async color => {
        // The one and only place a color is actually applied -- see the
        // function doc comment (#776).
        await applyColor(color);
        finish(color);
      },
      onCancel: () => {
        // Nothing to revert: onPreview never applied anything (#776).
        finish('');
      },
      onInvalid: () => safePostMessage({ type: 'invalid' }),
    });

    // See serializeMessageHandler's doc comment: without this, rapid
    // preview messages from dragging the color well or the EyeDropper can
    // race and post contrast updates out of order.
    const handleMessage = serializeMessageHandler(rawHandleMessage);

    panel.webview.onDidReceiveMessage(handleMessage);

    panel.onDidDispose(() => {
      disposed = true;
      if (!settled) {
        // Closing the panel (the tab's own "x", not the Cancel button) is
        // the same no-op-revert Cancel does (#776). Route it through the
        // same message queue as every preview/apply/cancel so it can't run
        // ahead of a still-queued message.
        void handleMessage({ type: 'cancel' });
      }
    });
  });
}
