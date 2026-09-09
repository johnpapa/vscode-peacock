import * as vscode from 'vscode';

/**
 * Stands in for the real vscode.InputBox returned by
 * vscode.window.createInputBox(). Captures the accept/hide/button listeners
 * that promptForColor() (inputs.ts) registers so tests can simulate typing +
 * Enter, Esc, and clicking the "pick visually" button (#708 follow-up --
 * "Add the picker to the Enter a color [flow] ... as another option").
 * Shared by every test that previously stubbed vscode.window.showInputBox to
 * feed Commands.enterColor a canned response.
 */
export function createFakeInputBox() {
  let acceptListener: (() => unknown) | undefined;
  let hideListener: (() => unknown) | undefined;
  let buttonListener: ((button: vscode.QuickInputButton) => unknown) | undefined;
  let disposed = false;
  let resolveReady!: () => void;
  // Resolves once promptForColor() (inputs.ts) has wired up its listeners,
  // so tests that go through vscode.commands.executeCommand (a real,
  // potentially async round trip) know it's safe to simulate user input
  // rather than racing a fixed timeout.
  const ready = new Promise<void>(resolve => {
    resolveReady = resolve;
  });

  const input = {
    value: '',
    placeholder: '',
    prompt: '',
    ignoreFocusOut: false,
    buttons: [] as readonly vscode.QuickInputButton[],
    onDidAccept: (listener: () => unknown) => {
      acceptListener = listener;
      resolveReady();
      return { dispose: () => undefined };
    },
    onDidHide: (listener: () => unknown) => {
      hideListener = listener;
      return { dispose: () => undefined };
    },
    onDidTriggerButton: (listener: (button: vscode.QuickInputButton) => unknown) => {
      buttonListener = listener;
      return { dispose: () => undefined };
    },
    show: () => undefined,
    hide: () => hideListener?.(),
    dispose: () => {
      disposed = true;
    },
  };

  return {
    input: input as unknown as vscode.InputBox,
    ready,
    typeAndAccept: async (value: string) => {
      await ready;
      input.value = value;
      acceptListener?.();
    },
    escape: async () => {
      await ready;
      hideListener?.();
    },
    clickPickVisuallyButton: async () => {
      await ready;
      await buttonListener?.(input.buttons[0]);
    },
    isDisposed: () => disposed,
  };
}
