import * as vscode from 'vscode';

export const extensionShortName = 'peacock';
export const extensionId = 'johnpapa.vscode-peacock';
export const favoriteColorSeparator = '->';

export const docsUri = vscode.Uri.parse('https://johnpapa.github.io/vscode-peacock/');

// Matches the default inactive alpha in VS Code of 0x99
// represented in 0-1 range for tinycolor.setAlpha()
export const inactiveElementAlpha = 0x99 / 0xff;

export const defaultAmountToDarkenLighten = 10;

export const defaultSaturation = 0.5;

export const azureBlue = '#007fff';
export const peacockGreen = '#42b883';

// Neutral fallback backgrounds for the Agents Window's
// `inactiveSessionView.background` counter-override. These mirror VS Code's
// own un-set defaults for `agents.background` (editor background on dark
// themes, sidebar background on light themes) so setting `agents.background`
// to an accent color doesn't also wash over the big center session/composer
// view, which inherits from it by default (see `collectAgentsWindowSettings`).
export const agentsWindowNeutralDarkBackground = '#1e1e1e';
export const agentsWindowNeutralLightBackground = '#f3f3f3';

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
