import { LiveShareSettings } from '../live-share';

export enum StandardSettings {
  Color = 'color',
  DarkenLightenPercentage = 'darkenLightenPercentage',
  DarkForegroundColor = 'darkForegroundColor',
  ElementAdjustments = 'elementAdjustments',
  ExcludedSettings = 'excludedSettings',
  FavoriteColors = 'favoriteColors',
  KeepBadgeColor = 'keepBadgeColor',
  KeepForegroundColor = 'keepForegroundColor',
  LightForegroundColor = 'lightForegroundColor',
  RemoteColor = 'remoteColor',
  ShowColorInStatusBar = 'showColorInStatusBar',
  SquigglyBeGone = 'squigglyBeGone',
  SurpriseMeFromFavoritesOnly = 'surpriseMeFromFavoritesOnly',
  SurpriseMeInFavoritesOrder = 'surpriseMeInFavoritesOrder',
  SurpriseMeOnStartup = 'surpriseMeOnStartup',
}

export enum AffectedSettings {
  EditorGroupBorder = 'affectEditorGroupBorder',
  PanelBorder = 'affectPanelBorder',
  SideBarBorder = 'affectSideBarBorder',
  SashHover = 'affectSashHover',
  ActivityBar = 'affectActivityBar',
  DebuggingStatusBar = 'affectDebuggingStatusBar',
  StatusBar = 'affectStatusBar',
  StatusAndTitleBorders = 'affectStatusAndTitleBorders',
  TabActiveBorder = 'affectTabActiveBorder',
  TabActiveBackground = 'affectTabActiveBackground',
  TitleBar = 'affectTitleBar',
  WindowBorder = 'affectWindowBorder',
  AgentsWindow = 'affectAgentsWindow',
}

export type AllSettings = StandardSettings | AffectedSettings | LiveShareSettings;

export enum Commands {
  addRecommendedFavorites = 'peacock.addRecommendedFavorites',
  changeColorToRandom = 'peacock.changeColorToRandom',
  changeColorToPeacockGreen = 'peacock.changeColorToPeacockGreen',
  changeColorToFavorite = 'peacock.changeColorToFavorite',
  darken = 'peacock.darken',
  enterColor = 'peacock.enterColor',
  lighten = 'peacock.lighten',
  removeAllColors = 'peacock.removeAllColors',
  resetWorkspaceColors = 'peacock.resetWorkspaceColors',
  saveColorToFavorites = 'peacock.saveColorToFavorites',
  showAndCopyCurrentColor = 'peacock.showAndCopyCurrentColor',
  affectSideBarBackground = 'peacock.affectSideBarBackground',
  showDocumentation = 'peacock.docs',
}

export enum ElementNames {
  activityBar = 'activityBar',
  statusBar = 'statusBar',
  titleBar = 'titleBar',
}

export enum ColorSettings {
  activityBar_activeBackground = 'activityBar.activeBackground',
  activityBar_activeBorder = 'activityBar.activeBorder',
  activityBar_background = 'activityBar.background',
  activityBar_foreground = 'activityBar.foreground',
  activityBar_inactiveForeground = 'activityBar.inactiveForeground',
  activityBar_badgeBackground = 'activityBarBadge.background',
  activityBar_badgeForeground = 'activityBarBadge.foreground',
  // Activity Bar "on top" layout tokens (VS Code 1.84+)
  activityBarTop_background = 'activityBarTop.background',
  activityBarTop_activeBackground = 'activityBarTop.activeBackground',
  activityBarTop_activeBorder = 'activityBarTop.activeBorder',
  activityBarTop_foreground = 'activityBarTop.foreground',
  activityBarTop_inactiveForeground = 'activityBarTop.inactiveForeground',
  commandCenter_border = 'commandCenter.border',
  commandCenter_foreground = 'commandCenter.foreground',
  editorGroupBorder = 'editorGroup.border',
  panelBorder = 'panel.border',
  sideBarBorder = 'sideBar.border',
  sashHover = 'sash.hoverBorder',
  squigglyBeGone_error = 'editorError.foreground',
  squigglyBeGone_warning = 'editorWarning.foreground',
  squigglyBeGone_info = 'editorInfo.foreground',
  statusBar_border = 'statusBar.border',
  statusBar_background = 'statusBar.background',
  statusBar_foreground = 'statusBar.foreground',
  statusBar_debuggingBorder = 'statusBar.debuggingBorder',
  statusBar_debuggingBackground = 'statusBar.debuggingBackground',
  statusBar_debuggingForeground = 'statusBar.debuggingForeground',
  statusBarItem_hoverBackground = 'statusBarItem.hoverBackground',
  statusBarItem_remoteBackground = 'statusBarItem.remoteBackground',
  statusBarItem_remoteForeground = 'statusBarItem.remoteForeground',
  tabActiveBorder = 'tab.activeBorder',
  tabActiveBackground = 'tab.activeBackground',
  titleBar_activeBackground = 'titleBar.activeBackground',
  titleBar_activeForeground = 'titleBar.activeForeground',
  titleBar_border = 'titleBar.border',
  titleBar_inactiveBackground = 'titleBar.inactiveBackground',
  titleBar_inactiveForeground = 'titleBar.inactiveForeground',
  window_activeBorder = 'window.activeBorder',
  window_inactiveBorder = 'window.inactiveBorder',
  // Agents Window tokens (VS Code 1.120+, src/vs/sessions/common/theme.ts).
  //
  // `agents.background`, `agentsPanel.background`/`agentsPanel.foreground`,
  // and `inactiveSessionView.background`/`.foreground` are no longer written
  // by Peacock (see `collectAgentsWindowSettings` for why - `agents.background`
  // is an unconditional, single shared token for the title bar, the whole
  // shell, AND the left Sessions sidebar, with no way to color just the
  // title bar). They're kept here only so a stale value left behind by an
  // earlier Peacock version is still cleared out.
  agents_background = 'agents.background',
  agentsPanel_background = 'agentsPanel.background',
  agentsPanel_foreground = 'agentsPanel.foreground',
  inactiveSessionView_background = 'inactiveSessionView.background',
  inactiveSessionView_foreground = 'inactiveSessionView.foreground',
  // Actually used by Peacock: narrow, decoupled accent tokens that can never
  // resolve to a full panel/sidebar background fill. `agentsCard.border` and
  // `agentsBottomPanel.border` both default to `agentsPanel.border`, so
  // setting it alone colors all three borders.
  agentsPanel_border = 'agentsPanel.border',
  agentsGradient_tintColor = 'agentsGradient.tintColor',
}

export type ColorAdjustment = 'lighten' | 'darken' | 'none';

export enum ColorAdjustmentOptions {
  lighten = 'lighten',
  darken = 'darken',
  none = 'none',
}

export enum Sections {
  peacockColorCustomizationSection = 'workbench.colorCustomizations',
  peacockSection = 'peacock',
}

export enum ForegroundColors {
  DarkForeground = '#15202b',
  LightForeground = '#e7e7e7',
  /**
   * Medium gray used ONLY in Cursor IDE for the title bar foreground.
   * Cursor mis-uses var(--vscode-titleBar-activeForeground) for editor toolbar
   * action icons (a Cursor CSS bug; VS Code is unaffected). DarkForeground
   * (#15202b) is invisible on Cursor's dark editor toolbar (~1.2:1). This gray
   * stays visible on both light Peacock title bars and dark editor toolbars.
   * See https://github.com/johnpapa/vscode-peacock/issues/647
   */
  CursorTitleBarForeground = '#595959',
}

// See WebAIM contrast guidelines: https://webaim.org/articles/contrast/
export enum ReadabilityRatios {
  UserInterfaceLow = 2,
  UserInterface = 3,
  Text = 4.5,
}

export enum ColorSource {
  WorkspaceValue = 'workspaceValue',
  GlobalValue = 'globalValue',
  DefaultValue = 'defaultValue',
  None = 'none',
}
