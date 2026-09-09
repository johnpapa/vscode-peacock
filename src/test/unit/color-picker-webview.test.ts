import { describe, it, expect, vi } from 'vitest';
import * as vm from 'vm';
import {
  createColorPickerMessageHandler,
  getColorPickerHtml,
  serializeMessageHandler,
} from '../../color-picker-html';
import { peacockGreen, azureBlue } from '../../models';

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

    it('ignores an invalid preview color rather than throwing', async () => {
      const onPreview = vi.fn();
      const handle = createColorPickerMessageHandler({
        onPreview,
        onApply: vi.fn(),
        onCancel: vi.fn(),
      });

      await expect(handle({ type: 'preview', color: 'not-a-color' })).resolves.toBeUndefined();
      expect(onPreview).not.toHaveBeenCalled();
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

    it('ignores an invalid apply color rather than resolving with it', async () => {
      const onApply = vi.fn();
      const handle = createColorPickerMessageHandler({
        onPreview: vi.fn(),
        onApply,
        onCancel: vi.fn(),
      });

      await handle({ type: 'apply', color: 'nope' });

      expect(onApply).not.toHaveBeenCalled();
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

    it('sets a restrictive Content-Security-Policy with no remote sources', () => {
      const html = getColorPickerHtml(peacockGreen);

      expect(html).toMatch(/Content-Security-Policy/);
      expect(html).toContain("default-src 'none'");
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
      const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);

      expect(scriptMatch).not.toBeNull();
      expect(() => new vm.Script(scriptMatch![1])).not.toThrow();
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
});
