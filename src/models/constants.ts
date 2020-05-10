import * as vscode from 'vscode';

export const extensionShortName = 'peacock';
export const extensionId = 'johnpapa.vscode-peacock';
export const favoriteColorSeparator = '->';

export const docsUri = vscode.Uri.parse('https://www.peacockcode.dev');

// Matches the default inactive alpha in VS Code of 0x99
// represented in 0-1 range for tinycolor.setAlpha()
export const inactiveElementAlpha = 0x99 / 0xff;

export const defaultAmountToDarkenLighten = 10;

export const defaultSaturation = 0.5;

export const azureBlue = '#007fff';
export const peacockGreen = '#42b883';

export const peacockMementos = {
  favoritesVersion: `${extensionShortName}.favoritesVersion`,
};

export const timeout = async (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

export const isObjectEmpty = (o: {} | undefined) =>
  typeof o === 'object' && Object.keys(o).length === 0;
