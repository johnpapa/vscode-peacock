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

/**
 * Message shape posted from the extension host back down to the webview
 * (see color-picker-webview.ts). Carries the exact title bar
 * background/foreground pairing Peacock's own applyColor() pipeline just
 * computed for the previewed color, so the picker's contrast swatch can
 * never drift from what Peacock actually applies (#708 follow-up).
 */
export interface ColorPickerContrastUpdate {
  type: 'contrast';
  backgroundHex: string;
  foregroundHex: string;
  ratio: number;
  isReadable: boolean;
}

export interface ColorPickerCallbacks {
  onPreview: (color: string) => void | Promise<void>;
  onApply: (color: string) => void | Promise<void>;
  onCancel: () => void | Promise<void>;
}

/**
 * Wraps a message handler so calls are processed strictly one at a time, in
 * the arrival order. vscode.Webview does not await a listener's returned
 * promise before delivering the next message, so a burst of rapid 'preview'
 * messages (dragging the native color well, or fast hex typing) can
 * otherwise run concurrently: two overlapping applyColor() calls racing to
 * read-modify-write workbench.colorCustomizations could let an earlier
 * color's write land on disk *after* a later one's, leaving a stale
 * background/foreground pairing applied even though the panel already
 * shows the final color (#708 follow-up -- "make sure that logic is being
 * applied, just like it is for any other color"). Queuing guarantees the
 * last message received is always the last one applied.
 */
export function serializeMessageHandler<T>(handler: (message: T) => void | Promise<void>) {
  let queue: Promise<void> = Promise.resolve();
  return (message: T): Promise<void> => {
    const result = queue.then(() => handler(message));
    // Keep the queue itself always-resolved so one handler rejecting (e.g.
    // an unexpected applyColor() failure) can't wedge every message queued
    // behind it -- callers still see their own call's rejection via `result`.
    queue = result.catch(() => undefined);
    return result;
  };
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
 * (with an optional EyeDropper API button for picking any on-screen pixel)
 * kept in sync with a hex text field, a live contrast preview swatch fed by
 * the extension host's own title-bar contrast logic, and Apply/Cancel.
 * There is no vscode.window.showColorPicker() API, so this Quick Pick +
 * webview combination is the smallest thing that gives a visual picker
 * without leaving the editor (#708).
 */
export function getColorPickerHtml(initialColor: string): string {
  const safeInitial = isValidColorInput(initialColor) ? initialColor : peacockGreen;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';" />
<style>
  :root {
    color-scheme: light dark;
  }
  * {
    box-sizing: border-box;
  }
  body {
    font-family: var(--vscode-font-family);
    color: var(--vscode-foreground);
    padding: 0;
    margin: 0;
  }
  .picker {
    max-width: 22em;
    margin: 1.5em auto;
    padding: 1.25em;
    border-radius: 8px;
    border: 1px solid var(--vscode-widget-border, var(--vscode-input-border, transparent));
    background: var(--vscode-editorWidget-background, var(--vscode-sideBar-background));
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
  }
  h1 {
    font-size: 1.1em;
    font-weight: 600;
    margin: 0 0 0.2em 0;
  }
  .subtitle {
    font-size: 0.85em;
    opacity: 0.75;
    margin: 0 0 1.2em 0;
    line-height: 1.4;
  }
  .field-label {
    display: block;
    font-size: 0.75em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    opacity: 0.7;
    margin-bottom: 0.4em;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 0.6em;
    margin-bottom: 1.1em;
  }
  input[type='color'] {
    width: 44px;
    height: 36px;
    padding: 0;
    border-radius: 6px;
    border: 1px solid var(--vscode-input-border, transparent);
    background: none;
    cursor: pointer;
  }
  input[type='text'] {
    flex: 1;
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: 0.95em;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border, transparent);
    border-radius: 6px;
    padding: 0.5em 0.7em;
  }
  input[type='text']:focus,
  input[type='color']:focus,
  button:focus {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: 1px;
  }
  input[type='text'].invalid {
    outline: 1px solid var(--vscode-inputValidation-errorBorder, #f14c4c);
    outline-offset: 0;
  }
  #eyedropperBtn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border-radius: 6px;
    font-size: 1em;
    line-height: 1;
    background: var(--vscode-button-secondaryBackground, transparent);
    color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
    border: 1px solid var(--vscode-input-border, transparent);
  }
  #eyedropperBtn:hover {
    background: var(--vscode-button-secondaryHoverBackground, var(--vscode-list-hoverBackground));
  }
  #eyedropperBtn[hidden] {
    display: none;
  }
  .contrast-preview {
    border-radius: 6px;
    padding: 0.9em 1em;
    margin-bottom: 1.2em;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6em;
    transition: background-color 0.12s ease-out, color 0.12s ease-out;
  }
  .contrast-preview .sample {
    font-weight: 600;
    font-size: 0.95em;
  }
  .contrast-badge {
    font-size: 0.72em;
    font-weight: 700;
    letter-spacing: 0.03em;
    padding: 0.2em 0.55em;
    border-radius: 999px;
    white-space: nowrap;
  }
  .contrast-badge.pass {
    background: rgba(35, 134, 54, 0.85);
    color: #ffffff;
  }
  .contrast-badge.fail {
    background: rgba(218, 54, 51, 0.85);
    color: #ffffff;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5em;
  }
  button {
    font-family: var(--vscode-font-family);
    font-size: 0.9em;
    padding: 0.45em 1.1em;
    border-radius: 6px;
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
  #applyBtn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  #cancelBtn {
    background: var(--vscode-button-secondaryBackground, transparent);
    color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
  }
  #cancelBtn:hover {
    background: var(--vscode-button-secondaryHoverBackground, var(--vscode-list-hoverBackground));
  }
</style>
</head>
<body>
  <div class="picker">
    <h1>Custom Color</h1>
    <p class="subtitle">Pick a color visually, then Apply it as your Peacock color.</p>

    <span class="field-label" id="colorFieldLabel">Color</span>
    <div class="row" role="group" aria-labelledby="colorFieldLabel">
      <input type="color" id="colorWell" value="${safeInitial}" aria-label="Color well" />
      <button type="button" id="eyedropperBtn" title="Pick a color from anywhere on screen" aria-label="Pick a color from anywhere on screen" hidden>&#128302;</button>
      <input type="text" id="hexInput" value="${safeInitial}" maxlength="9" spellcheck="false" aria-label="Hex color value" />
    </div>

    <span class="field-label">Title bar contrast preview</span>
    <div class="contrast-preview" id="contrastPreview">
      <span class="sample" id="contrastSample">Aa Peacock</span>
      <span class="contrast-badge" id="contrastBadge">--</span>
    </div>

    <div class="actions">
      <button id="cancelBtn" type="button">Cancel</button>
      <button id="applyBtn" type="button">Apply</button>
    </div>
  </div>
  <script>
    (function () {
      const vscodeApi = acquireVsCodeApi();
      const well = document.getElementById('colorWell');
      const hex = document.getElementById('hexInput');
      const applyBtn = document.getElementById('applyBtn');
      const eyedropperBtn = document.getElementById('eyedropperBtn');
      const contrastPreview = document.getElementById('contrastPreview');
      const contrastBadge = document.getElementById('contrastBadge');
      const hexPattern = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

      function setValidity(isValid) {
        hex.classList.toggle('invalid', !isValid);
        applyBtn.disabled = !isValid;
      }

      well.addEventListener('input', () => {
        hex.value = well.value;
        setValidity(true);
        vscodeApi.postMessage({ type: 'preview', color: well.value });
      });

      hex.addEventListener('input', () => {
        const isValid = hexPattern.test(hex.value);
        setValidity(isValid);
        if (isValid) {
          well.value = hex.value.length === 9 ? hex.value.slice(0, 7) : hex.value;
          vscodeApi.postMessage({ type: 'preview', color: hex.value });
        }
      });

      hex.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !applyBtn.disabled) {
          vscodeApi.postMessage({ type: 'apply', color: hex.value });
        }
      });

      document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          vscodeApi.postMessage({ type: 'cancel' });
        }
      });

      // EyeDropper is only available in newer Chromium (VS Code's Electron
      // runtime); feature-detect rather than assume, and simply keep the
      // native color well's own OS-level picker (which already includes an
      // eyedropper on macOS/Windows) as the fallback when unsupported.
      if ('EyeDropper' in window) {
        eyedropperBtn.hidden = false;
        eyedropperBtn.addEventListener('click', async () => {
          try {
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();
            well.value = result.sRGBHex;
            hex.value = result.sRGBHex;
            setValidity(true);
            vscodeApi.postMessage({ type: 'preview', color: result.sRGBHex });
          } catch (err) {
            // User pressed Escape to cancel the eyedropper -- not an error.
          }
        });
      }

      applyBtn.addEventListener('click', () => {
        if (!applyBtn.disabled) {
          vscodeApi.postMessage({ type: 'apply', color: hex.value });
        }
      });

      document.getElementById('cancelBtn').addEventListener('click', () => {
        vscodeApi.postMessage({ type: 'cancel' });
      });

      window.addEventListener('message', event => {
        const message = event.data;
        if (!message || message.type !== 'contrast') {
          return;
        }
        contrastPreview.style.backgroundColor = message.backgroundHex;
        contrastPreview.style.color = message.foregroundHex;
        contrastBadge.textContent = message.isReadable
          ? 'AA \u2713 ' + message.ratio.toFixed(1) + ':1'
          : 'Low contrast ' + message.ratio.toFixed(1) + ':1';
        contrastBadge.className = 'contrast-badge ' + (message.isReadable ? 'pass' : 'fail');
      });
    })();
  </script>
</body>
</html>`;
}
