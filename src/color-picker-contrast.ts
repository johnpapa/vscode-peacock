import * as vscode from 'vscode';
import { AffectedSettings, ElementNames, ReadabilityRatios } from './models';
import {
  getElementStyle,
  isAffectedSettingSelected,
  getKeepForegroundColor,
} from './configuration';
import { getReadabilityRatio } from './color-library';
import { getTitleBarForegroundForApp } from './title-bar-foreground';

export interface TitleBarContrastPreview {
  backgroundHex: string;
  foregroundHex: string;
  ratio: number;
  isReadable: boolean;
  /**
   * False when Peacock's current settings mean the title bar foreground
   * shown here is illustrative only (peacock.affectTitleBar is off, or
   * peacock.keepForegroundColor is on) rather than what will actually be
   * applied. The picker still shows the pairing Peacock *would* use so
   * users can judge contrast, but callers can use this to caveat it.
   */
  wouldBeApplied: boolean;
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

  const wouldBeApplied =
    isAffectedSettingSelected(AffectedSettings.TitleBar) && !getKeepForegroundColor();

  return {
    backgroundHex: titleBarStyle.backgroundHex,
    foregroundHex,
    ratio,
    isReadable: ratio >= ReadabilityRatios.Text,
    wouldBeApplied,
  };
}
