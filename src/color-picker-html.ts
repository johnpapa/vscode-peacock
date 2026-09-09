import { peacockGreen } from './models';
import { isValidColorInput, getColorHex } from './color-library';

/**
 * A random per-render token for the CSP's script-src, so the inline
 * <script> below is the only script this page's CSP will ever run,
 * rather than a blanket 'unsafe-inline' that would let ANY inline script
 * execute -- including one smuggled in through some future, less careful
 * edit that interpolates an unnormalized value into the HTML. Doesn't
 * need to be cryptographically random: it only has to be unguessable for
 * the lifetime of one panel render, not secret long-term, so plain
 * Math.random() (the same approach VS Code's own webview-sample
 * extension uses) avoids depending on Node's `crypto` module, which the
 * web/webworker extension bundle (extension-web.js) can't resolve (#708
 * follow-up).
 */
function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

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
  /**
   * Called instead of onPreview/onApply when a 'preview' or 'apply'
   * message's color fails isValidColorInput() even though the webview's
   * own client-side looksLikeColor() heuristic accepted it -- e.g. a typo
   * like "purpel" matches the client's "any run of letters" named-color
   * check, or a malformed rgb()/hsl() call. Without this, Apply stayed
   * enabled and clicking it silently did nothing: the host quietly
   * dropped the message with no feedback (#708 follow-up).
   */
  onInvalid?: (color: string) => void;
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
 * Invalid colors from 'preview'/'apply' never reach onPreview/onApply --
 * the webview's own hex field already guards against malformed input
 * before posting, so this is a second, authoritative check, not the
 * primary validation -- but callers are told via onInvalid rather than
 * the message being dropped with no signal at all.
 */
export function createColorPickerMessageHandler(callbacks: ColorPickerCallbacks) {
  return async (message: ColorPickerMessage) => {
    switch (message.type) {
      case 'preview':
        if (isValidColorInput(message.color)) {
          await callbacks.onPreview(message.color);
        } else {
          callbacks.onInvalid?.(message.color);
        }
        break;
      case 'apply':
        if (isValidColorInput(message.color)) {
          await callbacks.onApply(message.color);
        } else {
          callbacks.onInvalid?.(message.color);
        }
        break;
      case 'cancel':
        await callbacks.onCancel();
        break;
    }
  };
}

/**
 * Resolves the color the picker should display when it opens: the
 * caller's color, normalized to a plain #rrggbb[aa] hex string, if
 * Peacock considers it valid; peacockGreen otherwise (e.g. no
 * peacock.color set yet). Always normalizing through getColorHex() -- not
 * just validity-checking the raw input -- matters for two reasons: (1) a
 * string can pass isValidColorInput() (tinycolor's rgb()/hsl() parsing is
 * not anchored to the whole string) while still containing characters
 * that would break out of the HTML attribute it's interpolated into
 * below, e.g. a workspace's committed peacock.color set to
 * `rgb(1,2,3)" autofocus onfocus="...` -- getColorHex()'s tinycolor
 * output is always just `#` followed by hex digits, so it can never
 * contain a quote; (2) <input type="color"> only understands hex, so a
 * stored named/rgb/hsl/hsv color would otherwise render the well as black
 * while the text field shows the real value (#708 follow-up).
 *
 * Exported so color-picker-webview.ts can post this *same* resolved color
 * as the initial contrast preview that getColorPickerHtml() actually
 * renders -- otherwise an empty/invalid starting color would render
 * peacockGreen in the picker but compute the contrast preview from ''
 * (black), a second, unrelated instance of the same "resolve once, reuse
 * everywhere" problem (#708 follow-up).
 */
export function resolveInitialColor(initialColor: string): string {
  return isValidColorInput(initialColor) ? getColorHex(initialColor) : peacockGreen;
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
  const safeInitial = resolveInitialColor(initialColor);
  // <input type="color"> silently ignores a value with an alpha byte
  // (9-char #rrggbbaa, from Peacock's Hex8/RGBA/HSLA/HSVA input formats)
  // and falls back to black; seed the well with the alpha-less prefix and
  // let the hex text field show the full value.
  const wellInitial = safeInitial.length === 9 ? safeInitial.slice(0, 7) : safeInitial;
  const nonce = getNonce();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
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
    <p class="subtitle">Type a hex code, color name, or rgb/hsl/hsv value below, or pick one visually -- then Apply it as your Peacock color.</p>

    <span class="field-label" id="colorFieldLabel">Color</span>
    <div class="row" role="group" aria-labelledby="colorFieldLabel">
      <input type="color" id="colorWell" value="${wellInitial}" aria-label="Color well" />
      <button type="button" id="eyedropperBtn" title="Pick a color from anywhere on screen" aria-label="Pick a color from anywhere on screen" hidden><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M19.5 3.5a2.5 2.5 0 0 1 0 3.54l-1.06 1.06 1.5 1.5-2.12 2.12-1.5-1.5-8.5 8.5a1 1 0 0 1-.46.26l-4 1a1 1 0 0 1-1.21-1.21l1-4a1 1 0 0 1 .26-.46l8.5-8.5-1.5-1.5L12.03 2.7l1.5 1.5 1.06-1.06a2.5 2.5 0 0 1 3.54 0z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg></button>
      <input type="text" id="hexInput" value="${safeInitial}" maxlength="40" spellcheck="false" aria-label="Color value: hex, name, or rgb/hsl/hsv" placeholder="#42b883, DarkBlue, rgb(66, 184, 131)…" />
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
  <script nonce="${nonce}">
    (function () {
      const vscodeApi = acquireVsCodeApi();
      const well = document.getElementById('colorWell');
      const hex = document.getElementById('hexInput');
      const applyBtn = document.getElementById('applyBtn');
      const eyedropperBtn = document.getElementById('eyedropperBtn');
      const contrastPreview = document.getElementById('contrastPreview');
      const contrastBadge = document.getElementById('contrastBadge');
      const hexPattern = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
      // Accept the same broader set of formats Peacock's "Enter a Color"
      // input used to (#708 follow-up -- "merge... remove enter a color and
      // instead call it choose a custom color"): a bare hex value, a CSS
      // named color (letters only), or an rgb/rgba/hsl/hsla/hsv/hsva
      // function call. This is only a client-side heuristic to enable Apply
      // and drive live preview -- isValidColorInput() on the extension host
      // (color-picker-html.ts's createColorPickerMessageHandler) remains
      // the real, authoritative check before anything is ever applied.
      const namedColorPattern = /^[a-zA-Z]+$/;
      const functionColorPattern = /^(rgb|rgba|hsl|hsla|hsv|hsva)\\s*\\(/i;

      function looksLikeColor(value) {
        const trimmed = value.trim();
        return (
          trimmed.length > 0 &&
          (hexPattern.test(trimmed) ||
            namedColorPattern.test(trimmed) ||
            functionColorPattern.test(trimmed))
        );
      }

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
        const value = hex.value.trim();
        const isValid = looksLikeColor(value);
        setValidity(isValid);
        if (isValid) {
          // The native color well only understands hex; leave it as-is for
          // named/rgb/hsl/hsv input rather than fighting its format.
          if (hexPattern.test(value)) {
            well.value = value.length === 9 ? value.slice(0, 7) : value;
          }
          vscodeApi.postMessage({ type: 'preview', color: value });
        }
      });

      // Enter applies and Escape cancels no matter which control has focus
      // (color well, hex field, or the eyedropper button), matching the
      // Apply/Cancel buttons themselves. Buttons already activate on Enter
      // via the browser's own default behavior, so skip them here to avoid
      // posting a duplicate message (and to let a focused Cancel button's
      // Enter press still cancel, rather than being overridden by Apply).
      document.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
          if (event.target instanceof HTMLButtonElement) {
            return;
          }
          if (!applyBtn.disabled) {
            event.preventDefault();
            vscodeApi.postMessage({ type: 'apply', color: hex.value.trim() });
          }
          return;
        }
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
          vscodeApi.postMessage({ type: 'apply', color: hex.value.trim() });
        }
      });

      document.getElementById('cancelBtn').addEventListener('click', () => {
        vscodeApi.postMessage({ type: 'cancel' });
      });

      window.addEventListener('message', event => {
        const message = event.data;
        if (!message) {
          return;
        }
        if (message.type === 'invalid') {
          // The host's isValidColorInput() check is authoritative; this
          // client-side heuristic only knows a value LOOKS plausible (e.g.
          // any run of letters for a named color), not that it's real, so
          // surface the host's rejection instead of leaving Apply enabled
          // for a color that will never actually apply (#708 follow-up).
          setValidity(false);
          return;
        }
        if (message.type !== 'contrast') {
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
