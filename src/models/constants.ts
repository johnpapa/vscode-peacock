import * as vscode from 'vscode';

export const extensionShortName = 'peacock';
export const extensionId = 'johnpapa.vscode-peacock';
export const favoriteColorSeparator = '->';

// The extra Quick Pick item appended to the favorites list (#708) that opens
// the custom color picker webview. Distinct from any real favorite because
// favoriteColorSeparator never appears in it, so parseFavoriteColorValue()
// can't mistake it for one.
export const customColorPickerLabel = '$(paintcan) Custom color…';

export const docsUri = vscode.Uri.parse('https://johnpapa.github.io/vscode-peacock/');

// Matches the default inactive alpha in VS Code of 0x99
// represented in 0-1 range for tinycolor.setAlpha()
export const inactiveElementAlpha = 0x99 / 0xff;

export const defaultAmountToDarkenLighten = 10;

export const defaultSaturation = 0.5;

export const azureBlue = '#007fff';
export const peacockGreen = '#42b883';

export const peacockMementos = {
  favoritesVersion: `${extensionShortName}.favoritesVersion`,
  surpriseMeFavoritesOrderIndex: `${extensionShortName}.surpriseMeFavoritesOrderIndex`,
  surpriseMeFavoritesOrderKey: `${extensionShortName}.surpriseMeFavoritesOrderKey`,
  surpriseMeStartupSelections: `${extensionShortName}.surpriseMeStartupSelections`,
  colorCustomizationsBackupDone: `${extensionShortName}.colorCustomizationsBackupDone`,
};

export const timeout = async (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

export const isObjectEmpty = (o: Record<string, unknown> | undefined) =>
  typeof o === 'object' && Object.keys(o).length === 0;
