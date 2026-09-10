import { describe, it, expect, vi } from 'vitest';
import * as vm from 'vm';
import {
  createColorPickerMessageHandler,
  getColorPickerHtml,
  serializeMessageHandler,
} from '../../color-picker-html';
import { isValidColorInput } from '../../color-library';
import { peacockGreen, azureBlue } from '../../models';

/**
 * Extracts the contents of the picker's inline <script> tag from its
 * generated HTML. `[^>]*` on both the opening tag (e.g. the CSP nonce --
 * see getColorPickerHtml()'s use of getNonce()) and the closing tag
 * accepts anything up to the next `>` -- whitespace, a stray attribute,
 * whatever -- since an HTML parser ignores content in a closing tag
 * beyond the tag name, so `</script anything>` or `</script\t\n bar>`
 * are both real closing tags a naive `<\/script>`-only match would miss.
 * Case-insensitive throughout too (CodeQL: js/bad-tag-filter -- a match
 * that only accounts for one case/one exact form can be trivially missed
 * if the source ever emits a variant), even though color-picker-html.ts
 * always emits a plain lower case `<script nonce="...">...</script>`
 * today.
 */
function extractInlineScript(html: string): string {
  const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script[^>]*>/i);
  if (!scriptMatch) {
    throw new Error('Could not find inline <script> in generated picker HTML');
  }
  return scriptMatch[1];
}

describe('Color picker webview (#708)', () => {
  describe('serializeMessageHandler (#708 follow-up: contrast race condition)', () => {
    it('processes messages strictly in arrival order, even when an earlier call resolves later', async () => {
      const order: string[] = [];
      const handler = serializeMessageHandler(async (message: string) => {
        // The first message is deliberately the slowest, mirroring how an
        // earlier preview's applyColor() write could still be in flight
        // when a later preview message arrives (e.g. dragging the native
        // color well fires 'input' far faster than each write settles).
        const delay = message === 'first' ? 20 : 0;
        await new Promise(resolve => setTimeout(resolve, delay));
        order.push(message);
      });

      const first = handler('first');
      const second = handler('second');
      const third = handler('third');
      await Promise.all([first, second, third]);

      expect(order).toEqual(['first', 'second', 'third']);
    });

    it('still surfaces a handler rejection to its own caller without breaking the queue', async () => {
      const order: string[] = [];
      const handler = serializeMessageHandler(async (message: string) => {
        if (message === 'boom') {
          throw new Error('boom');
        }
        order.push(message);
      });

      const first = handler('first');
      const failing = handler('boom');
      const third = handler('third');

      await first;
      await expect(failing).rejects.toThrow('boom');
      await third;

      expect(order).toEqual(['first', 'third']);
    });
  });

  describe('createColorPickerMessageHandler', () => {
    it('calls onPreview for a valid preview color', async () => {
      const onPreview = vi.fn();
      const onApply = vi.fn();
      const onCancel = vi.fn();
      const handle = createColorPickerMessageHandler({ onPreview, onApply, onCancel });

      await handle({ type: 'preview', color: azureBlue });

      expect(onPreview).toHaveBeenCalledWith(azureBlue);
      expect(onApply).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('ignores an invalid preview color rather than throwing, and reports it via onInvalid', async () => {
      const onPreview = vi.fn();
      const onInvalid = vi.fn();
      const handle = createColorPickerMessageHandler({
        onPreview,
        onApply: vi.fn(),
        onCancel: vi.fn(),
        onInvalid,
      });

      await expect(handle({ type: 'preview', color: 'not-a-color' })).resolves.toBeUndefined();
      expect(onPreview).not.toHaveBeenCalled();
      expect(onInvalid).toHaveBeenCalledWith('not-a-color');
    });

    it('calls onApply for a valid apply color', async () => {
      const onApply = vi.fn();
      const handle = createColorPickerMessageHandler({
        onPreview: vi.fn(),
        onApply,
        onCancel: vi.fn(),
      });

      await handle({ type: 'apply', color: peacockGreen });

      expect(onApply).toHaveBeenCalledWith(peacockGreen);
    });

    it('ignores an invalid apply color rather than resolving with it, and reports it via onInvalid', async () => {
      const onApply = vi.fn();
      const onInvalid = vi.fn();
      const handle = createColorPickerMessageHandler({
        onPreview: vi.fn(),
        onApply,
        onCancel: vi.fn(),
        onInvalid,
      });

      await handle({ type: 'apply', color: 'nope' });

      expect(onApply).not.toHaveBeenCalled();
      expect(onInvalid).toHaveBeenCalledWith('nope');
    });

    it('does not throw when onInvalid is omitted (it is optional)', async () => {
      const handle = createColorPickerMessageHandler({
        onPreview: vi.fn(),
        onApply: vi.fn(),
        onCancel: vi.fn(),
      });

      await expect(handle({ type: 'preview', color: 'nope' })).resolves.toBeUndefined();
      await expect(handle({ type: 'apply', color: 'nope' })).resolves.toBeUndefined();
    });

    it('calls onCancel regardless of any color value', async () => {
      const onCancel = vi.fn();
      const handle = createColorPickerMessageHandler({
        onPreview: vi.fn(),
        onApply: vi.fn(),
        onCancel,
      });

      await handle({ type: 'cancel' });

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('getColorPickerHtml', () => {
    it('embeds a valid starting color into both the color well and hex field', () => {
      const html = getColorPickerHtml(azureBlue);

      expect(html).toContain(`id="colorWell" value="${azureBlue}"`);
      expect(html).toContain(`id="hexInput" value="${azureBlue}"`);
    });

    it('falls back to peacockGreen when the starting color is invalid or empty', () => {
      const html = getColorPickerHtml('');

      expect(html).toContain(`id="colorWell" value="${peacockGreen}"`);
      expect(html).toContain(`id="hexInput" value="${peacockGreen}"`);
    });

    it('normalizes the starting color to plain hex before interpolating it, so a crafted value cannot break out of the HTML attribute (security regression)', () => {
      // tinycolor's rgb() parsing is not anchored to the whole string, so
      // this passes isValidColorInput() even though it is not a color --
      // it's an attribute-breakout attempt a workspace could smuggle in
      // via a committed .vscode/settings.json peacock.color value. Before
      // normalizing through getColorHex(), this string was interpolated
      // into value="${safeInitial}" verbatim, closing the attribute early
      // and injecting an onfocus handler that runs on load.
      const evilColor = 'rgb(1,2,3)" autofocus onfocus="window.__pwned = true';
      expect(isValidColorInput(evilColor)).toBe(true); // confirms the premise

      const html = getColorPickerHtml(evilColor);

      expect(html).not.toContain(evilColor);
      expect(html).not.toContain('onfocus=');
      expect(html).not.toContain('autofocus');
      // The normalized value is a plain #rrggbb hex string in both fields.
      expect(html).toMatch(/id="colorWell" value="#[0-9a-fA-F]{6}"/);
      expect(html).toMatch(/id="hexInput" value="#[0-9a-fA-F]{6}"/);
    });

    it('seeds the color well with the alpha-less prefix of an 8-digit hex color, since <input type="color"> only understands 6-digit hex', () => {
      const translucentBlue = '#007fffcc'; // azureBlue with alpha
      const html = getColorPickerHtml(translucentBlue);

      // The well can't render alpha -- it gets the 6-digit prefix -- but
      // the hex text field keeps the full value the user actually chose.
      expect(html).toContain(`id="colorWell" value="${azureBlue}"`);
      expect(html).toContain(`id="hexInput" value="${translucentBlue}"`);
    });

    it("sets a restrictive Content-Security-Policy with no remote sources, and a per-render nonce instead of 'unsafe-inline' for script-src", () => {
      const html = getColorPickerHtml(peacockGreen);

      expect(html).toMatch(/Content-Security-Policy/);
      expect(html).toContain("default-src 'none'");
      // Only the CSS is trusted inline unconditionally -- it's fully
      // static, with no interpolated values -- while the script is gated
      // behind a nonce that changes every render, so no OTHER inline
      // script (e.g. one smuggled in by some future, less careful change)
      // can execute under this CSP.
      expect(html).toContain("style-src 'unsafe-inline'");
      expect(html).not.toMatch(/script-src[^;]*unsafe-inline/);
      const nonceMatch = html.match(/script-src 'nonce-([A-Za-z0-9]+)'/);
      expect(nonceMatch).not.toBeNull();
      expect(html).toContain(`<script nonce="${nonceMatch![1]}">`);
    });

    it('generates a different nonce on every call, so the CSP cannot be replayed across renders', () => {
      const first = getColorPickerHtml(peacockGreen).match(/nonce-([A-Za-z0-9]+)/)?.[1];
      const second = getColorPickerHtml(peacockGreen).match(/nonce-([A-Za-z0-9]+)/)?.[1];

      expect(first).toBeDefined();
      expect(second).toBeDefined();
      expect(first).not.toEqual(second);
    });

    it('includes a feature-detected EyeDropper button, hidden until JS confirms support', () => {
      const html = getColorPickerHtml(azureBlue);

      expect(html).toContain('id="eyedropperBtn"');
      expect(html).toMatch(/id="eyedropperBtn"[^>]*hidden/);
      expect(html).toContain("'EyeDropper' in window");
    });

    it('includes a live title-bar contrast preview swatch driven by host postMessage updates', () => {
      const html = getColorPickerHtml(azureBlue);

      expect(html).toContain('id="contrastPreview"');
      expect(html).toContain('id="contrastBadge"');
      expect(html).toMatch(/message\.type !== 'contrast'/);
    });

    it('accepts named colors and rgb/hsl/hsv function values in the hex/color field, not just hex (#708 follow-up: merged with Enter a Color)', () => {
      const html = getColorPickerHtml(azureBlue);

      // The field is no longer hex-only: it must not be capped at a hex
      // string's length, and the client-side heuristic must recognize
      // named colors ("DarkBlue") and rgb/rgba/hsl/hsla/hsv/hsva function
      // calls as valid enough to enable Apply and preview, mirroring every
      // format the retired Enter a Color input box used to accept.
      expect(html).toContain('id="hexInput"');
      expect(html).not.toMatch(/id="hexInput"[^>]*maxlength="9"/);
      expect(html).toMatch(/namedColorPattern/);
      expect(html).toMatch(/rgb\|rgba\|hsl\|hsla\|hsv\|hsva/);
    });

    it('generates an inline <script> that is syntactically valid JavaScript (regression: escaped chars inside a nested regex literal were silently stripped by the outer TS template literal, e.g. "\\s" collapsing to "s" and "\\(" collapsing to an unescaped "(", producing an unterminated-group SyntaxError that killed every listener -- Apply/Cancel/preview/contrast -- since a parse error aborts the whole inline script)', () => {
      const html = getColorPickerHtml(azureBlue);
      const script = extractInlineScript(html);

      expect(() => new vm.Script(script)).not.toThrow();
    });

    it("keeps the rgb/rgba/hsl/hsla/hsv/hsva function-color regex's backslashes intact through the outer template literal", () => {
      const html = getColorPickerHtml(azureBlue);

      // Any backslash that isn't doubled (e.g. a bare "\s" or "\(") gets its
      // backslash silently dropped by the *outer* TS template literal at
      // compile time, since "\s"/"\(" aren't recognized string escapes --
      // so the generated regex source must contain the doubled form.
      expect(html).toContain('/^(rgb|rgba|hsl|hsla|hsv|hsva)\\s*\\(/i');
    });
  });

  describe('Keyboard shortcuts: Enter applies, Escape cancels (#708 follow-up)', () => {
    /**
     * Extracts the picker's inline <script> and actually executes it (not
     * just parses it) against a minimal fake DOM/window, so these tests
     * exercise the real runtime keydown handler rather than just matching
     * strings against the generated source.
     */
    function runPickerScript(initialColor: string) {
      const html = getColorPickerHtml(initialColor);
      const script = extractInlineScript(html);

      class HTMLButtonElement {}

      function makeElement(isButton: boolean, initialValue = '') {
        const listeners: Record<string, Array<(event: any) => void>> = {};
        const element: any = {
          value: initialValue,
          disabled: false,
          hidden: false,
          className: '',
          style: {},
          textContent: '',
          classList: { toggle: () => {} },
          addEventListener(type: string, fn: (event: any) => void) {
            (listeners[type] ||= []).push(fn);
          },
        };
        if (isButton) {
          Object.setPrototypeOf(element, HTMLButtonElement.prototype);
        }
        return element;
      }

      const elements: Record<string, any> = {
        colorWell: makeElement(false, initialColor),
        hexInput: makeElement(false, initialColor),
        applyBtn: makeElement(true),
        eyedropperBtn: makeElement(true),
        contrastPreview: makeElement(false),
        contrastBadge: makeElement(false),
        cancelBtn: makeElement(true),
      };

      const documentListeners: Record<string, Array<(event: any) => void>> = {};
      const fakeDocument = {
        getElementById: (id: string) => elements[id],
        addEventListener(type: string, fn: (event: any) => void) {
          (documentListeners[type] ||= []).push(fn);
        },
      };

      const windowListeners: Record<string, Array<(event: any) => void>> = {};
      const fakeWindow: any = {
        addEventListener(type: string, fn: (event: any) => void) {
          (windowListeners[type] ||= []).push(fn);
        },
      };

      const posted: Array<Record<string, unknown>> = [];
      const sandbox: any = {
        document: fakeDocument,
        window: fakeWindow,
        HTMLButtonElement,
        acquireVsCodeApi: () => ({
          postMessage: (message: Record<string, unknown>) => posted.push(message),
        }),
      };
      vm.createContext(sandbox);
      new vm.Script(script).runInContext(sandbox);

      const dispatchKeydown = (key: string, target: any = elements.hexInput) => {
        let defaultPrevented = false;
        (documentListeners['keydown'] || []).forEach(fn =>
          fn({ key, target, preventDefault: () => (defaultPrevented = true) }),
        );
        return defaultPrevented;
      };

      // Simulates the extension host posting a message down to the webview
      // (e.g. { type: 'invalid' } or { type: 'contrast', ... }), the same
      // way panel.webview.postMessage() in color-picker-webview.ts arrives
      // on the client side as a 'message' event on window.
      const dispatchMessage = (data: Record<string, unknown>) => {
        (windowListeners['message'] || []).forEach(fn => fn({ data }));
      };

      return { elements, posted, dispatchKeydown, dispatchMessage };
    }

    it('pressing Enter while the hex field is focused posts an apply message with the current value', () => {
      const { elements, posted, dispatchKeydown } = runPickerScript(azureBlue);
      elements.hexInput.value = '#123456';

      dispatchKeydown('Enter', elements.hexInput);

      expect(posted).toEqual([{ type: 'apply', color: '#123456' }]);
    });

    it('pressing Enter while the color well is focused also applies (not just the hex field)', () => {
      const { elements, posted, dispatchKeydown } = runPickerScript(azureBlue);
      elements.hexInput.value = '#654321';

      dispatchKeydown('Enter', elements.colorWell);

      expect(posted).toEqual([{ type: 'apply', color: '#654321' }]);
    });

    it('pressing Enter does nothing when the current value is invalid (Apply disabled)', () => {
      const { posted, elements, dispatchKeydown } = runPickerScript(azureBlue);
      elements.applyBtn.disabled = true;

      dispatchKeydown('Enter', elements.hexInput);

      expect(posted).toEqual([]);
    });

    it("pressing Enter while a button (e.g. Cancel) has focus does not also post apply, letting the button's own click win", () => {
      const { elements, posted, dispatchKeydown } = runPickerScript(azureBlue);

      dispatchKeydown('Enter', elements.cancelBtn);

      expect(posted).toEqual([]);
    });

    it('pressing Escape posts a cancel message regardless of which control has focus', () => {
      const { elements, posted, dispatchKeydown } = runPickerScript(azureBlue);

      dispatchKeydown('Escape', elements.applyBtn);

      expect(posted).toEqual([{ type: 'cancel' }]);
    });
  });

  describe("Host->webview 'invalid' message (#708 follow-up: silently-dropped Apply)", () => {
    function runPickerScript(initialColor: string) {
      const html = getColorPickerHtml(initialColor);
      const script = extractInlineScript(html);

      function makeElement(initialValue = '') {
        return {
          value: initialValue,
          disabled: false,
          className: '',
          style: {},
          textContent: '',
          classList: { toggle: () => {} },
          addEventListener: () => {},
        };
      }

      const elements: Record<string, any> = {
        colorWell: makeElement(initialColor),
        hexInput: makeElement(initialColor),
        applyBtn: makeElement(),
        eyedropperBtn: makeElement(),
        contrastPreview: makeElement(),
        contrastBadge: makeElement(),
        cancelBtn: makeElement(),
      };

      const fakeDocument = {
        getElementById: (id: string) => elements[id],
        addEventListener: () => {},
      };

      const windowListeners: Record<string, Array<(event: any) => void>> = {};
      const fakeWindow: any = {
        addEventListener(type: string, fn: (event: any) => void) {
          (windowListeners[type] ||= []).push(fn);
        },
      };

      const sandbox: any = {
        document: fakeDocument,
        window: fakeWindow,
        HTMLButtonElement: class {},
        acquireVsCodeApi: () => ({ postMessage: () => undefined }),
      };
      vm.createContext(sandbox);
      new vm.Script(script).runInContext(sandbox);

      const dispatchMessage = (data: Record<string, unknown>) => {
        (windowListeners['message'] || []).forEach(fn => fn({ data }));
      };

      return { elements, dispatchMessage };
    }

    it("marks the hex field invalid and disables Apply on a host {type: 'invalid'} message", () => {
      const { elements, dispatchMessage } = runPickerScript(azureBlue);
      // Apply starts enabled (a valid starting color); the host is the
      // one telling us this value doesn't actually work.
      elements.applyBtn.disabled = false;

      dispatchMessage({ type: 'invalid' });

      expect(elements.applyBtn.disabled).toBe(true);
    });

    it('ignores an unrelated message type', () => {
      const { elements, dispatchMessage } = runPickerScript(azureBlue);
      elements.applyBtn.disabled = false;

      dispatchMessage({ type: 'something-else' });

      expect(elements.applyBtn.disabled).toBe(false);
    });

    it('ignores a message with no data', () => {
      const { elements, dispatchMessage } = runPickerScript(azureBlue);
      elements.applyBtn.disabled = false;

      expect(() => dispatchMessage(undefined as any)).not.toThrow();
      expect(elements.applyBtn.disabled).toBe(false);
    });

    it('still applies a contrast update after an earlier invalid message (the two message types do not interfere)', () => {
      const { elements, dispatchMessage } = runPickerScript(azureBlue);

      dispatchMessage({ type: 'invalid' });
      dispatchMessage({
        type: 'contrast',
        backgroundHex: '#ffa500',
        foregroundHex: '#15202b',
        ratio: 10,
        isReadable: true,
      });

      expect(elements.contrastPreview.style.backgroundColor).toBe('#ffa500');
      expect(elements.contrastBadge.textContent).toContain('10.0:1');
    });
  });
});
