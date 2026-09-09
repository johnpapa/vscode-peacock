import * as vscode from 'vscode';

/**
 * Stands in for the real vscode.WebviewPanel returned by
 * vscode.window.createWebviewPanel(). Captures the message/dispose
 * listeners that color-picker-webview.ts registers so tests can simulate
 * the webview's own script posting messages back to the extension (#708).
 * Shared by custom-color-picker.test.ts and color-input.test.ts, since both
 * exercise promptForCustomColorViaColorPicker() -- once directly via the
 * standalone command/favorites flow, once as the "pick visually" hand-off
 * from Enter a Color.
 */
export function createFakeWebviewPanel() {
  let messageListener: ((message: unknown) => unknown) | undefined;
  let disposeListener: (() => unknown) | undefined;
  let disposed = false;
  let resolveReady!: () => void;
  const postedMessages: unknown[] = [];
  // Resolves once color-picker-webview.ts has wired up its message handler,
  // so tests that go through vscode.commands.executeCommand (a real,
  // potentially async round trip) know it's safe to post a message rather
  // than racing a fixed timeout.
  const ready = new Promise<void>(resolve => {
    resolveReady = resolve;
  });

  const panel = {
    webview: {
      html: '',
      onDidReceiveMessage: (listener: (message: unknown) => unknown) => {
        messageListener = listener;
        resolveReady();
        return { dispose: () => undefined };
      },
      postMessage: async (message: unknown) => {
        postedMessages.push(message);
        return true;
      },
      asWebviewUri: (uri: vscode.Uri) => uri,
      cspSource: '',
    },
    onDidDispose: (listener: () => unknown) => {
      disposeListener = listener;
      return { dispose: () => undefined };
    },
    dispose: () => {
      if (disposed) {
        return;
      }
      disposed = true;
      disposeListener?.();
    },
    reveal: () => undefined,
  };

  return {
    panel: panel as unknown as vscode.WebviewPanel,
    ready,
    postedMessages,
    postToExtension: async (message: unknown) => {
      await ready;
      await messageListener?.(message);
    },
    simulateUserClosingPanel: () => panel.dispose(),
  };
}
