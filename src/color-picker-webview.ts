import * as vscode from 'vscode';
import { applyColor } from './apply-color';
import {
  createColorPickerMessageHandler,
  getColorPickerHtml,
  serializeMessageHandler,
} from './color-picker-html';
import { getTitleBarContrastPreview } from './color-picker-contrast';

export { getColorPickerHtml } from './color-picker-html';
export type { ColorPickerMessage, ColorPickerCallbacks } from './color-picker-html';

/**
 * Posts the title bar background/foreground pairing Peacock would apply for
 * `color` down to the webview so its contrast preview swatch stays in sync
 * with the same logic applyColor() just used -- never a separate,
 * reimplemented copy of it (#708 follow-up).
 */
function postContrastPreview(panel: vscode.WebviewPanel, color: string) {
  const preview = getTitleBarContrastPreview(color);
  panel.webview.postMessage({
    type: 'contrast',
    backgroundHex: preview.backgroundHex,
    foregroundHex: preview.foregroundHex,
    ratio: preview.ratio,
    isReadable: preview.isReadable,
  });
}

/**
 * Opens the picker as a webview panel and resolves to the applied hex color,
 * or '' if the user canceled. Mirrors the favorites Quick Pick's live-preview
 * behavior (#708): every color-well/hex edit calls applyColor() immediately,
 * and canceling reverts to whatever color was active before the picker opened.
 */
export async function promptForCustomColorViaColorPicker(startingColor: string): Promise<string> {
  return new Promise<string>(resolve => {
    const panel = vscode.window.createWebviewPanel(
      'peacockCustomColorPicker',
      'Peacock: Custom Color',
      { viewColumn: vscode.ViewColumn.Active, preserveFocus: false },
      { enableScripts: true, retainContextWhenHidden: false },
    );

    let settled = false;
    const finish = (result: string) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(result);
      panel.dispose();
    };

    panel.webview.html = getColorPickerHtml(startingColor);
    postContrastPreview(panel, startingColor);

    const rawHandleMessage = createColorPickerMessageHandler({
      onPreview: async color => {
        await applyColor(color);
        postContrastPreview(panel, color);
      },
      onApply: color => finish(color),
      onCancel: async () => {
        if (startingColor) {
          await applyColor(startingColor);
        }
        finish('');
      },
    });

    // See serializeMessageHandler's doc comment: without this, rapid
    // preview messages from dragging the color well or the EyeDropper can
    // race and leave a stale color applied.
    const handleMessage = serializeMessageHandler(rawHandleMessage);

    panel.webview.onDidReceiveMessage(handleMessage);

    panel.onDidDispose(async () => {
      if (!settled) {
        if (startingColor) {
          await applyColor(startingColor);
        }
        finish('');
      }
    });
  });
}
