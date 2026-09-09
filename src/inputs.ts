import * as vscode from 'vscode';
import { peacockGreen, customColorPickerLabel } from './models';
import { getFavoriteColors, getEnvironmentAwareColor } from './configuration';
import { applyColor } from './apply-color';
import { parseFavoriteColorValue } from './favorite-color';
import { promptForCustomColorViaColorPicker } from './color-picker-webview';

export async function promptForColor(): Promise<string> {
  return new Promise<string>(resolve => {
    // Uses the lower-level InputBox API (rather than showInputBox) so we can
    // add a button that launches the visual picker (#708 follow-up --
    // "Add the picker to the Enter a color [flow] ... as another option").
    const input = vscode.window.createInputBox();
    input.ignoreFocusOut = true;
    input.placeholder = peacockGreen;
    input.prompt =
      'Enter a background color for the title bar in RGB hex format or a valid HTML color name, or use the button to pick one visually';
    input.value = peacockGreen;
    input.buttons = [
      {
        iconPath: new vscode.ThemeIcon('symbol-color'),
        tooltip: 'Pick a color visually…',
      },
    ];

    let settled = false;
    let openingPicker = false;

    const finish = (result: string) => {
      if (settled) {
        return;
      }
      settled = true;
      input.dispose();
      resolve(result);
    };

    input.onDidAccept(() => finish((input.value || '').trim()));
    input.onDidHide(() => {
      // Skip when we hid the box ourselves to hand off to the picker below;
      // that flow settles the promise itself once the picker resolves.
      if (!openingPicker) {
        finish('');
      }
    });
    input.onDidTriggerButton(async () => {
      openingPicker = true;
      input.hide();
      const startingColor = getEnvironmentAwareColor();
      const color = await promptForCustomColorViaColorPicker(startingColor);
      finish(color);
    });

    input.show();
  });
}

export async function promptForFavoriteColorName(color: string) {
  if (!color) {
    return;
  }
  const options: vscode.InputBoxOptions = {
    ignoreFocusOut: true,
    placeHolder: 'Mandalorian Blue',
    prompt: `Enter a name for the color ${color}`,
    value: '',
  };
  const inputName = await vscode.window.showInputBox(options);
  return inputName || '';
}

export async function promptForFavoriteColor() {
  const { menu } = getFavoriteColors();
  const menuWithCustomColor = [...menu, customColorPickerLabel];
  const options = {
    placeHolder: 'Pick a favorite color, or choose Custom color… to pick one visually',
    onDidSelectItem: await tryColorWithPeacock(),
  };
  const selection = (await vscode.window.showQuickPick(menuWithCustomColor, options)) || '';

  if (selection === customColorPickerLabel) {
    const startingColor = getEnvironmentAwareColor();
    return await promptForCustomColorViaColorPicker(startingColor);
  }

  if (selection) {
    const selectedColor = parseFavoriteColorValue(selection);
    return selectedColor || '';
  }

  return '';
}

async function tryColorWithPeacock() {
  return async (item: string) => {
    const color = parseFavoriteColorValue(item);
    return await applyColor(color);
  };
}
