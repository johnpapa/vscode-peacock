export const extensionShortName = 'peacock';
export const extensionId = 'johnpapa.vscode-peacock';
export const favoriteColorSeparator = '->';

// Matches the default inactive alpha in VS Code of 0x99
// represented in 0-1 range for tinycolor.setAlpha()
export const inactiveElementAlpha = 0x99 / 0xff;

export const defaultAmountToDarkenLighten = 10;

export const defaultSaturation = 0.5;

export const azureBlue = '#007fff';
export const peacockGreen = '#42b883';

export const peacockMementos = {
  favoritesVersion: `${extensionShortName}.favoritesVersion`,
  peacockColor: `${extensionShortName}.peacockColor`,
};

export const timeout = async (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));