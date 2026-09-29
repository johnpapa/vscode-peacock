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
import { AffectedSettings, extensionShortName } from './models';
import { Logger } from './logging';
import { debounce } from './debounce';

export { getColorPickerHtml } from './color-picker-html';
export type { ColorPickerMessage, ColorPickerCallbacks } from './color-picker-html';

/**
 * How long to wait, after the *last* preview event, before actually
 * applying that color to the workbench. Dragging the native color well
 * fires an 'input' event on essentially every pixel of movement -- calling
 * applyColor() (which writes workbench.colorCustomizations to
 * settings.json and triggers a workbench theme re-render) on every one of
 * those made VS Code visibly slow down while dragging (#776). Debouncing
 * collapses a whole drag gesture down to (usually) a single write, once
 * the cursor settles, while still giving live workbench feedback -- not
 * just the panel's own contrast swatch -- shortly after the user stops
 * moving the eyedropper/cursor (#776 follow-up).
 */
export const PREVIEW_APPLY_DEBOUNCE_MS = 150;

/**
 * Opens the picker as a webview panel and resolves to the applied hex color,
 * or '' if the user canceled. Every color-well/hex edit immediately updates
 * the panel's own title-bar contrast preview swatch (a cheap, in-memory
 * computation), and -- debounced by PREVIEW_APPLY_DEBOUNCE_MS -- also
 * applies the color to the actual workbench, so the user can see their
 * real title bar/status bar/etc. update live while picking, without a
 * write happening on every single drag event (#776, #776 follow-up).
 * Apply immediately cancels any pending debounced write and applies the
 * final color right away; Cancel (or closing the panel) cancels any
 * pending write and reverts to whatever was active before the picker
 * opened.
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

    // applyColor() is a read-modify-write of workbench.colorCustomizations,
    // so two overlapping calls can let an earlier color's write land after
    // a later one's (see serializeMessageHandler's doc comment). Debouncing
    // moves the preview's write out of the message queue and onto a timer,
    // which means the queue alone no longer orders it against Apply/Cancel:
    // a debounced write that fired ~150ms after the last drag event can
    // still be in flight when the user clicks Apply or Cancel, and would
    // otherwise race -- and potentially clobber -- that final write. Routing
    // *every* applyColor() call (debounced preview, Apply, Cancel/close)
    // through this one serializer restores the ordering guarantee: the last
    // one requested is always the last one written (#776 follow-up).
    const applyColorSerialized = serializeMessageHandler<string>(async color => {
      await applyColor(color);
    });

    const debouncedApplyPreview = debounce((color: string) => {
      if (settled) {
        // A still-in-flight debounce timer from just before Apply/Cancel/
        // close resolved the picker must not write a color after the
        // fact -- the settled outcome always wins (mirrors the same
        // `settled` guard used everywhere else in this function).
        return;
      }
      // Nothing awaits this timer callback, so an unexpected applyColor()
      // failure here would surface as an unhandled rejection rather than a
      // caught error -- log it instead.
      void applyColorSerialized(color).catch(error =>
        Logger.info(`${extensionShortName}: failed to apply previewed color ${color}: ${error}`),
      );
    }, PREVIEW_APPLY_DEBOUNCE_MS);

    const finish = (result: string) => {
      if (settled) {
        return;
      }
      settled = true;
      debouncedApplyPreview.cancel();
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
        // Once the picker has definitively resolved (Apply/Cancel clicked,
        // or the panel closed) a still-in-flight preview from just before
        // that -- e.g. the last event of a color-well drag -- must not
        // overwrite the decided outcome.
        if (settled) {
          return;
        }
        // The contrast swatch updates immediately on every event (it's a
        // cheap, in-memory computation); only the actual workbench write
        // is debounced (#776 follow-up).
        postContrastPreview(color);
        debouncedApplyPreview(color);
      },
      onApply: async color => {
        // Apply is the user's explicit "commit" action: cancel any
        // pending debounced write and apply the final color immediately,
        // rather than waiting out PREVIEW_APPLY_DEBOUNCE_MS. Going through
        // applyColorSerialized (not applyColor directly) means a debounced
        // preview whose timer already fired, and whose write is still in
        // flight, completes first -- so this final write always lands last.
        debouncedApplyPreview.cancel();
        await applyColorSerialized(color);
        finish(color);
      },
      onCancel: async () => {
        debouncedApplyPreview.cancel();
        // Always call applyColor(), even when startingColor is '' (no color
        // was set before the picker opened): applyColor('') unapplies any
        // colors via its own isValidColorInput() check (see apply-color.ts),
        // which is exactly the revert this needs. Gating this call on
        // `startingColor` being truthy would skip that unapply and leave a
        // debounced preview that already landed permanently applied (#776
        // follow-up). Serialized for the same reason as onApply: an
        // already-in-flight debounced preview must not land *after* this
        // revert and leave the canceled color applied.
        await applyColorSerialized(startingColor);
        finish('');
      },
      onInvalid: () => safePostMessage({ type: 'invalid' }),
    });

    // See serializeMessageHandler's doc comment: without this, rapid
    // preview messages from dragging the color well or the EyeDropper can
    // race and post contrast updates out of order. The applyColor() writes
    // those messages trigger are ordered separately, by
    // applyColorSerialized above, since debouncing moves them off this
    // queue and onto a timer.
    const handleMessage = serializeMessageHandler(rawHandleMessage);

    panel.webview.onDidReceiveMessage(handleMessage);

    panel.onDidDispose(() => {
      disposed = true;
      if (!settled) {
        // Closing the panel (the tab's own "x", not the Cancel button) is
        // the same revert Cancel does. Route it through the same message
        // queue as every preview/apply/cancel -- not a direct applyColor()
        // call -- so it can't race a still-queued preview (e.g. from
        // dragging the color well right up to the moment the panel
        // closes) and leave that stale preview applied after the revert
        // (#708 follow-up).
        void handleMessage({ type: 'cancel' });
      }
    });
  });
}
