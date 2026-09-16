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
  /**
   * False when peacock.affectTitleBar is off, so Peacock won't touch the
   * title bar's background or foreground at all -- the preview below is
   * still computed (so the swatch stays informative), but it won't
   * actually be applied.
   */
  titleBarAffected: boolean;
  /**
   * False when the title bar background WILL be applied but its
   * foreground won't -- i.e. peacock.keepForegroundColor is on, so
   * collectTitleBarSettings() leaves titleBar.activeForeground untouched
   * instead of writing the computed foregroundHex below.
   */
  foregroundApplied: boolean;
}

export interface TitleBarContrastPreviewOptions {
  /** Mirrors isAffectedSettingSelected(AffectedSettings.TitleBar). Defaults to true (the package.json default). */
  titleBarAffected?: boolean;
  /** Mirrors getKeepForegroundColor(). Defaults to false (the package.json default). */
  keepForegroundColor?: boolean;
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
 *
 * Kept as a pure function (no vscode config reads of its own, unlike
 * collectTitleBarSettings) so it stays unit-testable in the Vitest lane --
 * callers pass in whatever isAffectedSettingSelected(AffectedSettings.TitleBar)
 * and getKeepForegroundColor() currently resolve to, the same way
 * prepareColors() passes keepForegroundColor into collectTitleBarSettings()
 * rather than having it read config itself.
 */
export function getTitleBarContrastPreview(
  backgroundHex: string,
  options: TitleBarContrastPreviewOptions = {},
): TitleBarContrastPreview {
  const { titleBarAffected = true, keepForegroundColor = false } = options;
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
    titleBarAffected,
    foregroundApplied: titleBarAffected && !keepForegroundColor,
  };
}
