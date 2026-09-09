import { peacockGreen } from './models';
import { isValidColorInput } from './color-library';

/**
 * Message shapes posted from the webview's own script (see getColorPickerHtml).
 * 'preview' fires on every color-well/hex edit for live preview; 'apply' and
 * 'cancel' are the two ways the picker can resolve.
 */
export type ColorPickerMessage =
  | { type: 'preview'; color: string }
  | { type: 'apply'; color: string }
  | { type: 'cancel' };

export interface ColorPickerCallbacks {
  onPreview: (color: string) => void | Promise<void>;
  onApply: (color: string) => void | Promise<void>;
  onCancel: () => void | Promise<void>;
}

/**
 * Pure message-handling logic, factored out of the webview wiring (in
 * color-picker-webview.ts) so it's testable without a real vscode.Webview.
 * Invalid colors from 'preview'/'apply' are silently ignored rather than
 * throwing -- the webview's own hex field already guards against malformed
 * input before posting, so this is a second, defensive check, not the
 * primary validation.
 */
export function createColorPickerMessageHandler(callbacks: ColorPickerCallbacks) {
  return async (message: ColorPickerMessage) => {
    switch (message.type) {
      case 'preview':
        if (isValidColorInput(message.color)) {
          await callbacks.onPreview(message.color);
        }
        break;
      case 'apply':
        if (isValidColorInput(message.color)) {
          await callbacks.onApply(message.color);
        }
        break;
      case 'cancel':
        await callbacks.onCancel();
        break;
    }
  };
}

/**
 * Small, self-contained HTML page: a native <input type="color"> color well
 * kept in sync with a hex text field, plus Apply/Cancel. There is no
 * vscode.window.showColorPicker() API, so this Quick Pick + webview
 * combination is the smallest thing that gives a visual picker without
 * leaving the editor (#708).
 */
export function getColorPickerHtml(initialColor: string): string {
  const safeInitial = isValidColorInput(initialColor) ? initialColor : peacockGreen;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';" />
<style>
  body {
    font-family: var(--vscode-font-family);
    color: var(--vscode-foreground);
    padding: 1.2em;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 0.75em;
    margin-bottom: 1.2em;
  }
  input[type='color'] {
    width: 48px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--vscode-input-border, transparent);
    background: none;
    cursor: pointer;
  }
  input[type='text'] {
    width: 8em;
    font-family: var(--vscode-editor-font-family, monospace);
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border, transparent);
    padding: 0.3em 0.5em;
  }
  .actions {
    display: flex;
    gap: 0.5em;
  }
  button {
    font-family: var(--vscode-font-family);
    padding: 0.4em 1em;
    border: none;
    cursor: pointer;
  }
  #applyBtn {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
  }
  #applyBtn:hover {
    background: var(--vscode-button-hoverBackground);
  }
  #cancelBtn {
    background: var(--vscode-button-secondaryBackground, transparent);
    color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
  }
</style>
</head>
<body>
  <div class="row">
    <input type="color" id="colorWell" value="${safeInitial}" />
    <input type="text" id="hexInput" value="${safeInitial}" maxlength="9" spellcheck="false" />
  </div>
  <div class="actions">
    <button id="applyBtn">Apply</button>
    <button id="cancelBtn">Cancel</button>
  </div>
  <script>
    (function () {
      const vscodeApi = acquireVsCodeApi();
      const well = document.getElementById('colorWell');
      const hex = document.getElementById('hexInput');
      const hexPattern = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

      well.addEventListener('input', () => {
        hex.value = well.value;
        vscodeApi.postMessage({ type: 'preview', color: well.value });
      });

      hex.addEventListener('input', () => {
        if (hexPattern.test(hex.value)) {
          well.value = hex.value.length === 9 ? hex.value.slice(0, 7) : hex.value;
          vscodeApi.postMessage({ type: 'preview', color: hex.value });
        }
      });

      document.getElementById('applyBtn').addEventListener('click', () => {
        vscodeApi.postMessage({ type: 'apply', color: hex.value });
      });

      document.getElementById('cancelBtn').addEventListener('click', () => {
        vscodeApi.postMessage({ type: 'cancel' });
      });
    })();
  </script>
</body>
</html>`;
}
