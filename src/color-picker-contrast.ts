import * as vscode from 'vscode';
import { ElementNames, ReadabilityRatios } from './models';
import { getElementStyle } from './configuration';
import { getReadabilityRatio } from './color-library';
import { getTitleBarForegroundForApp } from './title-bar-foreground';

export interface TitleBarContrastPreview {
  backgroundHex: string;
  foregroundHex: string;
  ratio: number;
  isReadable: boolean;
}

/**
 * Computes the exact same title bar background/foreground pairing that
 * collectTitleBarSettings() in configuration/read-configuration.ts writes to
 * workbench.colorCustomizations for a given background color -- including
 * the element-specific darken/lighten adjustment and the Cursor-only
 * mid-gray override (#647/#700) -- so the custom color picker's live
 * contrast preview can never drift from what Peacock actually applies
 * (#708 follow-up: "make sure that logic is being applied, just like it is
 * for any other color").
 */
export function getTitleBarContrastPreview(backgroundHex: string): TitleBarContrastPreview {
  const titleBarStyle = getElementStyle(backgroundHex, ElementNames.titleBar);
  const foregroundHex = getTitleBarForegroundForApp(
    vscode.env.appName,
    titleBarStyle.backgroundHex,
    titleBarStyle.foregroundHex,
  );
  const ratio = getReadabilityRatio(titleBarStyle.backgroundHex, foregroundHex);

  return {
    backgroundHex: titleBarStyle.backgroundHex,
    foregroundHex,
    ratio,
    isReadable: ratio >= ReadabilityRatios.Text,
  };
}
