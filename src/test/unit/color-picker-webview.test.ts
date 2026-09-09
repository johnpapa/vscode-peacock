import { describe, it, expect, vi } from 'vitest';
import { createColorPickerMessageHandler, getColorPickerHtml } from '../../color-picker-html';
import { peacockGreen, azureBlue } from '../../models';

describe('Color picker webview (#708)', () => {
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
  });
});
