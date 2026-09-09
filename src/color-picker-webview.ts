import * as vscode from 'vscode';
import { applyColor } from './apply-color';
import { createColorPickerMessageHandler, getColorPickerHtml } from './color-picker-html';

export { getColorPickerHtml } from './color-picker-html';
export type { ColorPickerMessage, ColorPickerCallbacks } from './color-picker-html';

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

    const handleMessage = createColorPickerMessageHandler({
      onPreview: async color => {
        await applyColor(color);
      },
      onApply: color => finish(color),
      onCancel: async () => {
        if (startingColor) {
          await applyColor(startingColor);
        }
        finish('');
      },
    });

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
