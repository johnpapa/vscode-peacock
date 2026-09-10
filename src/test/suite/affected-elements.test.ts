import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as assert from 'assert';
import {
  IPeacockSettings,
  IPeacockAffectedElementSettings,
  Commands,
  ColorSettings,
  ReadabilityRatios,
  peacockGreen,
  Sections,
} from '../../models';
import { setupTestSuite, teardownTestSuite, setupTest } from './lib/setup-teardown-test-suite';
import {
  getKeepForegroundColor,
  updateKeepForegroundColor,
  getKeepBadgeColor,
  updateKeepBadgeColor,
  getElementStyle,
  getColorCustomizationConfig,
  getColorCustomizationConfigFromGlobal,
  updateAffectedElements,
} from '../../configuration';
import {
  getColorBrightness,
  getReadabilityRatio,
  getColorComplementHex,
  getAgentsWindowNeutralStyle,
} from '../../color-library';
import { executeCommand, allAffectedElements } from './lib/constants';

suite('Affected elements', () => {
  const originalValues = {} as IPeacockSettings;

  suiteSetup(async () => await setupTestSuite(originalValues));
  suiteTeardown(async () => await teardownTestSuite(originalValues));
  setup(async () => await setupTest());

  suite('keep foreground color = false', () => {
    let originalValue: boolean;
    suiteSetup(async () => {
      originalValue = getKeepForegroundColor();
      await updateKeepForegroundColor(false);
    });

    test('sets all color customizations for affected elements', async () => {
      await testsSetsColorCustomizationsForAffectedElements();
    });

    test('does not set color customizations for elements not affected', async () => {
      await testsDoesNotSetColorCustomizationsForAffectedElements();
    });

    suiteTeardown(async () => {
      await updateKeepForegroundColor(originalValue);
    });
  });

  suite('keep foreground color = true', () => {
    let originalValue: boolean;
    suiteSetup(async () => {
      originalValue = getKeepForegroundColor();
      await updateKeepForegroundColor(true);
    });

    test('sets all color customizations for affected elements', async () => {
      await testsSetsColorCustomizationsForAffectedElements();
    });

    test('does not set color customizations for elements not affected', async () => {
      await testsDoesNotSetColorCustomizationsForAffectedElements();
    });

    suiteTeardown(async () => {
      await updateKeepForegroundColor(originalValue);
    });
  });

  suite('keep badge color = false', () => {
    let originalValue: boolean;
    suiteSetup(async () => {
      originalValue = getKeepBadgeColor();
      await updateKeepBadgeColor(false);
    });

    test('sets all color customizations for affected elements', async () => {
      await testsSetsColorCustomizationsForAffectedElements();
    });

    test('does not set color customizations for elements not affected', async () => {
      await testsDoesNotSetColorCustomizationsForAffectedElements();
    });

    suiteTeardown(async () => {
      await updateKeepBadgeColor(originalValue);
    });
  });

  suite('keep badge color = true', () => {
    let originalValue: boolean;
    suiteSetup(async () => {
      originalValue = getKeepBadgeColor();
      await updateKeepBadgeColor(true);
    });

    test('sets all color customizations for affected elements', async () => {
      await testsSetsColorCustomizationsForAffectedElements();
    });

    test('does not set color customizations for elements not affected', async () => {
      await testsDoesNotSetColorCustomizationsForAffectedElements();
    });

    suiteTeardown(async () => {
      await updateKeepBadgeColor(originalValue);
    });
  });

  suite('Affected elements', () => {
    suiteSetup(async () => {
      await updateAffectedElements({
        activityBar: false,
        statusBar: false,
        debuggingStatusBar: false,
        titleBar: false,

        editorGroupBorder: false,
        panelBorder: false,
        sideBarBorder: false,
        sashHover: false,

        tabActiveBorder: false,
        windowBorder: false,
        agentsWindow: false,
      } as IPeacockAffectedElementSettings);
    });

    test('editorGroupBorder is colored when enabled', async () => {
      await updateAffectedElements({
        editorGroupBorder: true,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.equal(config[ColorSettings.editorGroupBorder], peacockGreen);
    });

    test('editorGroupBorder is not colored when disabled', async () => {
      await updateAffectedElements({
        editorGroupBorder: false,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.ok(!config[ColorSettings.editorGroupBorder]);
    });

    test('panelBorder is colored when enabled', async () => {
      await updateAffectedElements({
        panelBorder: true,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.equal(config[ColorSettings.panelBorder], peacockGreen);
    });

    test('panelBorder is not colored when disabled', async () => {
      await updateAffectedElements({
        panelBorder: false,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.ok(!config[ColorSettings.panelBorder]);
    });

    test('sideBarBorder is colored when enabled', async () => {
      await updateAffectedElements({
        sideBarBorder: true,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.equal(config[ColorSettings.sideBarBorder], peacockGreen);
    });

    test('sideBarBorder is not colored when disabled', async () => {
      await updateAffectedElements({
        sideBarBorder: false,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.ok(!config[ColorSettings.sideBarBorder]);
    });

    test('sashHover is colored when enabled', async () => {
      await updateAffectedElements({
        sashHover: true,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.equal(config[ColorSettings.sashHover], peacockGreen);
    });

    test('sashHover is not colored when disabled', async () => {
      await updateAffectedElements({
        sashHover: false,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.ok(!config[ColorSettings.sashHover]);
    });

    test('windowBorder sets activeBorder and inactiveBorder when enabled', async () => {
      await updateAffectedElements({
        windowBorder: true,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.equal(config[ColorSettings.window_activeBorder], peacockGreen);
      assert.equal(config[ColorSettings.window_inactiveBorder], peacockGreen);
    });

    test('windowBorder does not set activeBorder and inactiveBorder when disabled', async () => {
      await updateAffectedElements({
        windowBorder: false,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.ok(!config[ColorSettings.window_activeBorder]);
      assert.ok(!config[ColorSettings.window_inactiveBorder]);
    });

    test('agentsWindow sets agents.background and inactiveSessionView colors when enabled', async () => {
      await updateAffectedElements({
        agentsWindow: true,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();
      const keepForegroundColor = getKeepForegroundColor();
      const style = getElementStyle(peacockGreen);
      const isLightTheme = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light;
      const neutralStyle = getAgentsWindowNeutralStyle(isLightTheme);

      // `agents.background` colors the title bar (and Sessions list
      // sticky-scroll header) directly.
      assert.equal(config[ColorSettings.agents_background], style.backgroundHex);

      // `agentsPanel.background`/`.foreground` are intentionally left unset -
      // see `collectAgentsWindowSettings` for why setting them recolors big
      // content areas (panels, terminal, the active session view).
      assert.ok(!config[ColorSettings.agentsPanel_background]);
      assert.ok(!config[ColorSettings.agentsPanel_foreground]);

      // `inactiveSessionView.background` is counter-overridden to a neutral,
      // theme-appropriate color so `agents.background`'s accent doesn't
      // bleed into the big center session/composer view, which inherits
      // from `agents.background` by default.
      assert.equal(config[ColorSettings.inactiveSessionView_background], neutralStyle.backgroundHex);
      assert.ok(
        shouldKeepColorTest(
          neutralStyle.foregroundHex,
          ColorSettings.inactiveSessionView_foreground,
          keepForegroundColor,
        ),
      );

      await updateAffectedElements(allAffectedElements);
    });

    test('agentsWindow does not set any agents colors when disabled', async () => {
      await updateAffectedElements({
        agentsWindow: false,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.ok(!config[ColorSettings.agents_background]);
      assert.ok(!config[ColorSettings.agentsPanel_background]);
      assert.ok(!config[ColorSettings.agentsPanel_foreground]);
      assert.ok(!config[ColorSettings.inactiveSessionView_background]);
      assert.ok(!config[ColorSettings.inactiveSessionView_foreground]);
    });

    test('inactiveSessionView.foreground is contrast-aware for a light theme neutral background', async () => {
      const originalKeepForegroundColor = getKeepForegroundColor();
      await updateKeepForegroundColor(false);
      await updateAffectedElements({
        agentsWindow: true,
      } as IPeacockAffectedElementSettings);

      const config = await getPeacockWorkspaceConfigAfterEnterColor('hsl(0 0.5 0.75)');
      const backgroundHex = config[ColorSettings.inactiveSessionView_background];
      const foregroundHex = config[ColorSettings.inactiveSessionView_foreground];

      assert.equal(foregroundHex, getAgentsWindowNeutralStyle(false).foregroundHex);
      assert.equal(backgroundHex, getAgentsWindowNeutralStyle(false).backgroundHex);

      await updateKeepForegroundColor(originalKeepForegroundColor);
      await updateAffectedElements(allAffectedElements);
    });

    test('agents.background is contrast-independent of accent lightness (neutral override always applies)', async () => {
      const originalKeepForegroundColor = getKeepForegroundColor();
      await updateKeepForegroundColor(false);
      await updateAffectedElements({
        agentsWindow: true,
      } as IPeacockAffectedElementSettings);

      // Regardless of whether the chosen accent color is light or dark, the
      // `inactiveSessionView.*` counter-override should always resolve to
      // the same neutral, theme-appropriate value - it must never track the
      // accent color itself.
      const lightAccentConfig = await getPeacockWorkspaceConfigAfterEnterColor('hsl(0 0.5 0.75)');
      const darkAccentConfig = await getPeacockWorkspaceConfigAfterEnterColor('hsl(0 0.5 0.25)');

      assert.equal(
        lightAccentConfig[ColorSettings.inactiveSessionView_background],
        darkAccentConfig[ColorSettings.inactiveSessionView_background],
      );
      assert.equal(
        lightAccentConfig[ColorSettings.inactiveSessionView_foreground],
        darkAccentConfig[ColorSettings.inactiveSessionView_foreground],
      );

      await updateKeepForegroundColor(originalKeepForegroundColor);
      await updateAffectedElements(allAffectedElements);
    });

    test('inactiveSessionView.foreground respects keepForegroundColor', async () => {
      const originalKeepForegroundColor = getKeepForegroundColor();
      await updateKeepForegroundColor(true);
      await updateAffectedElements({
        agentsWindow: true,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.ok(!config[ColorSettings.inactiveSessionView_foreground]);
      // backgrounds are still set even when the foreground is kept
      assert.ok(config[ColorSettings.agents_background]);
      assert.ok(config[ColorSettings.inactiveSessionView_background]);

      await updateKeepForegroundColor(originalKeepForegroundColor);
      await updateAffectedElements(allAffectedElements);
    });

    test('agentsWindow mirrors its colors to the user (global) settings when enabled', async () => {
      // The Agents Window is a single window shared across all workspaces, not
      // tied to any one workspace folder, so it does not read Peacock's
      // workspace-scoped color customizations. Peacock also mirrors these
      // keys to the user (global) settings so the Agents Window picks up the
      // color too.
      await updateAffectedElements({
        agentsWindow: true,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const style = getElementStyle(peacockGreen);
      const isLightTheme = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light;
      const neutralStyle = getAgentsWindowNeutralStyle(isLightTheme);
      const globalConfig = getColorCustomizationConfigFromGlobal();

      assert.equal(globalConfig[ColorSettings.agents_background], style.backgroundHex);
      assert.ok(!globalConfig[ColorSettings.agentsPanel_background]);
      assert.ok(!globalConfig[ColorSettings.agentsPanel_foreground]);
      assert.equal(
        globalConfig[ColorSettings.inactiveSessionView_background],
        neutralStyle.backgroundHex,
      );
      assert.equal(
        globalConfig[ColorSettings.inactiveSessionView_foreground],
        neutralStyle.foregroundHex,
      );

      // clean up: disabling and re-applying should clear the global keys too
      await updateAffectedElements({
        agentsWindow: false,
      } as IPeacockAffectedElementSettings);
      await executeCommand(Commands.changeColorToPeacockGreen);
      await updateAffectedElements(allAffectedElements);
    });

    test('agentsWindow clears its colors from the user (global) settings when disabled', async () => {
      await updateAffectedElements({
        agentsWindow: true,
      } as IPeacockAffectedElementSettings);
      await executeCommand(Commands.changeColorToPeacockGreen);

      await updateAffectedElements({
        agentsWindow: false,
      } as IPeacockAffectedElementSettings);
      await executeCommand(Commands.changeColorToPeacockGreen);

      const globalConfig = getColorCustomizationConfigFromGlobal();

      assert.ok(!globalConfig[ColorSettings.agents_background]);
      assert.ok(!globalConfig[ColorSettings.agentsPanel_background]);
      assert.ok(!globalConfig[ColorSettings.agentsPanel_foreground]);
      assert.ok(!globalConfig[ColorSettings.inactiveSessionView_background]);
      assert.ok(!globalConfig[ColorSettings.inactiveSessionView_foreground]);

      await updateAffectedElements(allAffectedElements);
    });

    test('agentsWindow clears a stale agentsPanel.background left over from an older Peacock version', async () => {
      // Regression test: an earlier version of this feature set
      // `agentsPanel.background` instead of `agents.background`, which VS
      // Code uses as the *default* color for the active session view and
      // the standard panel/terminal backgrounds - so it painted far more of
      // the window than intended. Simulate a workspace/user settings file
      // left over from that version and confirm the current code cleans it
      // up rather than leaving it in place forever.
      const config = vscode.workspace.getConfiguration();
      await config.update(
        Sections.peacockColorCustomizationSection,
        { [ColorSettings.agentsPanel_background]: peacockGreen },
        vscode.ConfigurationTarget.Workspace,
      );
      await config.update(
        Sections.peacockColorCustomizationSection,
        { [ColorSettings.agentsPanel_background]: peacockGreen },
        vscode.ConfigurationTarget.Global,
      );

      await updateAffectedElements({
        agentsWindow: true,
      } as IPeacockAffectedElementSettings);
      await executeCommand(Commands.changeColorToPeacockGreen);

      const workspaceConfig = getColorCustomizationConfig();
      const globalConfig = getColorCustomizationConfigFromGlobal();

      assert.ok(!workspaceConfig[ColorSettings.agentsPanel_background]);
      assert.ok(!globalConfig[ColorSettings.agentsPanel_background]);

      await updateAffectedElements(allAffectedElements);
    });

    test('tabActiveBackground is colored when enabled', async () => {
      await updateAffectedElements({
        tabActiveBackground: true,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.equal(config[ColorSettings.tabActiveBackground], peacockGreen);
    });

    test('tabActiveBackground is not colored when disabled', async () => {
      await updateAffectedElements({
        tabActiveBackground: false,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.ok(!config[ColorSettings.tabActiveBackground]);
    });

    test('tabActiveBorder and tabActiveBackground can be enabled independently', async () => {
      await updateAffectedElements({
        tabActiveBorder: true,
        tabActiveBackground: false,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.equal(config[ColorSettings.tabActiveBorder], peacockGreen);
      assert.ok(!config[ColorSettings.tabActiveBackground]);
    });

    suiteTeardown(async () => {
      await updateAffectedElements(allAffectedElements);
    });
  });

  suite('No affected elements', () => {
    suiteSetup(async () => {
      await updateAffectedElements({
        activityBar: false,
        statusBar: false,
        debuggingStatusBar: false,
        titleBar: false,
        editorGroupBorder: false,
        panelBorder: false,
        sideBarBorder: false,
        sashHover: false,
        tabActiveBorder: false,
        tabActiveBackground: false,
        windowBorder: false,
        agentsWindow: false,
      } as IPeacockAffectedElementSettings);
    });

    test('does not set any color customizations when no elements affected', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      assert.ok(!config[ColorSettings.titleBar_activeBackground]);
      assert.ok(!config[ColorSettings.titleBar_activeForeground]);
      assert.ok(!config[ColorSettings.titleBar_inactiveBackground]);
      assert.ok(!config[ColorSettings.titleBar_activeForeground]);
      assert.ok(!config[ColorSettings.activityBar_background]);
      assert.ok(!config[ColorSettings.activityBar_activeBackground]);
      assert.ok(!config[ColorSettings.activityBar_foreground]);
      assert.ok(!config[ColorSettings.activityBar_inactiveForeground]);
      assert.ok(!config[ColorSettings.activityBarTop_background]);
      assert.ok(!config[ColorSettings.activityBarTop_activeBackground]);
      assert.ok(!config[ColorSettings.activityBarTop_foreground]);
      assert.ok(!config[ColorSettings.activityBarTop_inactiveForeground]);
      // assert.ok(!config[ColorSettings.activityBar_activeBorder]);
      assert.ok(!config[ColorSettings.statusBar_foreground]);
      assert.ok(!config[ColorSettings.statusBar_background]);
      assert.ok(!config[ColorSettings.statusBar_debuggingBorder]);
      assert.ok(!config[ColorSettings.statusBar_debuggingBackground]);
      assert.ok(!config[ColorSettings.statusBar_debuggingForeground]);
      assert.ok(!config[ColorSettings.panelBorder]);
      assert.ok(!config[ColorSettings.sideBarBorder]);
      assert.ok(!config[ColorSettings.editorGroupBorder]);
      assert.ok(!config[ColorSettings.sashHover]);
      assert.ok(!config[ColorSettings.tabActiveBorder]);
      assert.ok(!config[ColorSettings.tabActiveBackground]);
      assert.ok(!config[ColorSettings.window_activeBorder]);
      assert.ok(!config[ColorSettings.window_inactiveBorder]);
      assert.ok(!config[ColorSettings.agents_background]);
      assert.ok(!config[ColorSettings.agentsPanel_background]);
      assert.ok(!config[ColorSettings.agentsPanel_foreground]);
      assert.ok(!config[ColorSettings.inactiveSessionView_background]);
      assert.ok(!config[ColorSettings.inactiveSessionView_foreground]);
    });

    suiteTeardown(async () => {
      await updateAffectedElements(allAffectedElements);
    });
  });

  suite('Status Bar', () => {
    test('does not set item hover color when status bar is not affected', async () => {
      await updateAffectedElements({
        activityBar: true,
        statusBar: false,
        debuggingStatusBar: false,
        titleBar: true,
        tabActiveBorder: true,
        tabActiveBackground: false,
        editorGroupBorder: true,
        panelBorder: true,
        sideBarBorder: true,
        sashHover: true,
        statusAndTitleBorders: false,
        windowBorder: false,
        agentsWindow: false,
      });

      const value = await getColorSettingAfterEnterColor(
        peacockGreen,
        ColorSettings.statusBarItem_hoverBackground,
      );
      assert.ok(!value);

      await updateAffectedElements(allAffectedElements);
    });

    test('sets item hover color to darker on a light background', async () => {
      const config = await getPeacockWorkspaceConfigAfterEnterColor('hsl(0 0.5 0.75)');
      const backgroundHex = config[ColorSettings.statusBar_background];
      const hoverBackgroundHex = config[ColorSettings.statusBarItem_hoverBackground];

      assert.ok(getColorBrightness(backgroundHex) > getColorBrightness(hoverBackgroundHex));
    });

    test('sets item hover color to lighter on a dark background', async () => {
      const config = await getPeacockWorkspaceConfigAfterEnterColor('hsl(0 0.5 0.25)');
      const backgroundHex = config[ColorSettings.statusBar_background];
      const hoverBackgroundHex = config[ColorSettings.statusBarItem_hoverBackground];

      assert.ok(getColorBrightness(backgroundHex) < getColorBrightness(hoverBackgroundHex));
    });

    test('status bar remote host styles are set when status bar is affected', async () => {
      await updateAffectedElements({
        statusBar: true,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      const remoteBackground = config[ColorSettings.statusBarItem_remoteBackground];
      const remoteForeground = config[ColorSettings.statusBarItem_remoteForeground];
      assert.ok(remoteBackground);
      assert.ok(remoteForeground);
    });

    test('remote badge background differs from status bar background for contrast', async () => {
      await updateAffectedElements({
        statusBar: true,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      const statusBarBg = config[ColorSettings.statusBar_background];
      const remoteBadgeBg = config[ColorSettings.statusBarItem_remoteBackground];
      assert.ok(statusBarBg, 'statusBar.background should be set');
      assert.ok(remoteBadgeBg, 'statusBarItem.remoteBackground should be set');
      assert.notEqual(
        remoteBadgeBg,
        statusBarBg,
        'Remote badge should differ from status bar for visibility',
      );
    });

    test('status bar remote host styles are not set when status bar is affected', async () => {
      await updateAffectedElements({
        statusBar: false,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();
      assert.ok(!config[ColorSettings.statusBarItem_remoteBackground]);
      assert.ok(!config[ColorSettings.statusBarItem_remoteForeground]);

      await updateAffectedElements(allAffectedElements);
    });

    test('debugging styles are set when debugging status bar is affected', async () => {
      await updateAffectedElements({
        statusBar: true,
        debuggingStatusBar: true,
        statusAndTitleBorders: true,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();

      const debuggingBackground = config[ColorSettings.statusBar_debuggingBackground];
      const debuggingForeground = config[ColorSettings.statusBar_debuggingForeground];
      const debuggingBorder = config[ColorSettings.statusBar_debuggingBorder];
      assert.ok(debuggingBackground);
      assert.ok(debuggingForeground);
      assert.ok(debuggingBorder);
    });

    test('debugging background and foreground match status bar when affectDebuggingStatusBar is false', async () => {
      // Regression test for #572: status bar should not disappear during launch/debug
      // when affectDebuggingStatusBar is false (the default). Peacock must always write
      // statusBar.debuggingBackground/Foreground so VS Code cannot override with its default
      // orange debugging color.
      await updateAffectedElements({
        statusBar: true,
        debuggingStatusBar: false,
        statusAndTitleBorders: true,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();
      const statusBarBackground = config[ColorSettings.statusBar_background];
      const statusBarForeground = config[ColorSettings.statusBar_foreground];
      const debuggingBackground = config[ColorSettings.statusBar_debuggingBackground];
      const debuggingForeground = config[ColorSettings.statusBar_debuggingForeground];
      const debuggingBorder = config[ColorSettings.statusBar_debuggingBorder];

      // debugging colors should be set to preserve Peacock's color during debug
      assert.ok(
        debuggingBackground,
        'debuggingBackground should be set to preserve color during debug',
      );
      assert.ok(
        debuggingForeground,
        'debuggingForeground should be set to preserve color during debug',
      );
      // debugging colors should match the regular status bar colors
      assert.equal(
        debuggingBackground,
        statusBarBackground,
        'debuggingBackground should match statusBar.background',
      );
      assert.equal(
        debuggingForeground,
        statusBarForeground,
        'debuggingForeground should match statusBar.foreground',
      );
      // border should NOT be set when affectDebuggingStatusBar is false
      assert.ok(
        !debuggingBorder,
        'debuggingBorder should not be set when affectDebuggingStatusBar is false',
      );

      await updateAffectedElements(allAffectedElements);
    });

    test('debugging styles are not set when status bar is not affected', async () => {
      await updateAffectedElements({
        statusBar: false,
        debuggingStatusBar: true,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();
      assert.ok(!config[ColorSettings.statusBar_debuggingBackground]);
      assert.ok(!config[ColorSettings.statusBar_debuggingForeground]);
      assert.ok(!config[ColorSettings.statusBar_debuggingBorder]);

      await updateAffectedElements(allAffectedElements);
    });

    test('sets debugging background color to a complement of the activity bar color', async () => {
      await updateAffectedElements({
        debuggingStatusBar: true,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();
      const statusBackgroundHex = config[ColorSettings.statusBar_debuggingBackground];
      const activityBackgroundHex = config[ColorSettings.activityBar_background];
      assert.ok(statusBackgroundHex != activityBackgroundHex);
      assert.ok(statusBackgroundHex === getColorComplementHex(activityBackgroundHex));
    });
  });

  suite('Activity bar badge', () => {
    test('activity bar badge styles are set when activity bar is affected', async () => {
      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();
      const badgeBackground = config[ColorSettings.activityBar_badgeBackground];
      const badgeForeground = config[ColorSettings.activityBar_badgeForeground];
      assert.ok(badgeBackground);
      assert.ok(badgeForeground);
    });

    test('activity bar badge styles are not set when activity bar is not affected', async () => {
      await updateAffectedElements({
        activityBar: false,
        statusBar: true,
        titleBar: true,
      } as IPeacockAffectedElementSettings);

      await executeCommand(Commands.changeColorToPeacockGreen);
      const config = getColorCustomizationConfig();
      assert.ok(!config[ColorSettings.activityBar_badgeBackground]);
      assert.ok(!config[ColorSettings.activityBar_badgeBackground]);

      await updateAffectedElements(allAffectedElements);
    });

    test('activity bar badge is readable over white activity bar', async () => {
      await testActivityBarBadgeColoringMeetsReadabilityThreshold('white');
    });

    test('activity bar badge is readable over 25% luminance activity bar', async () => {
      await testActivityBarBadgeColoringMeetsReadabilityThreshold('hsl (0 0 0.25)');
    });

    test('activity bar badge is readable over 50% luminance activity bar', async () => {
      await testActivityBarBadgeColoringMeetsReadabilityThreshold('hsl (0 0 0.50)');
    });

    test('activity bar badge is readable over 75% luminance activity bar', async () => {
      await testActivityBarBadgeColoringMeetsReadabilityThreshold('hsl (0 0 0.75)');
    });

    test('activity bar badge is readable over black activity bar', async () => {
      await testActivityBarBadgeColoringMeetsReadabilityThreshold('black');
    });

    test('activity bar badge is readable over peacock green activity bar', async () => {
      await testActivityBarBadgeColoringMeetsReadabilityThreshold(peacockGreen);
    });

    async function testActivityBarBadgeColoringMeetsReadabilityThreshold(backgroundHex: string) {
      // Stub the async input box to return a response
      const stub = await sinon
        .stub(vscode.window, 'showInputBox')
        .returns(Promise.resolve(backgroundHex));
      // fire the command
      await executeCommand(Commands.enterColor);
      const config = getColorCustomizationConfig();
      const value = config[ColorSettings.activityBar_badgeBackground];
      stub.restore();

      assert.ok(getReadabilityRatio(backgroundHex, value) > ReadabilityRatios.UserInterfaceLow);
    }
  });
});

async function testsDoesNotSetColorCustomizationsForAffectedElements() {
  await updateAffectedElements({
    activityBar: false,
    statusBar: false,
  } as IPeacockAffectedElementSettings);
  await executeCommand(Commands.changeColorToPeacockGreen);
  const config = getColorCustomizationConfig();
  const keepForegroundColor = getKeepForegroundColor();
  const style = getElementStyle(peacockGreen);

  assert.equal(style.backgroundHex, config[ColorSettings.titleBar_activeBackground]);

  assert.ok(
    shouldKeepColorTest(
      style.foregroundHex,
      ColorSettings.titleBar_activeForeground,
      keepForegroundColor,
    ),
  );

  assert.equal(style.inactiveBackgroundHex, config[ColorSettings.titleBar_inactiveBackground]);

  assert.ok(
    shouldKeepColorTest(
      style.inactiveForegroundHex,
      ColorSettings.titleBar_inactiveForeground,
      keepForegroundColor,
    ),
  );

  assert.equal(
    config[ColorSettings.commandCenter_border],
    config[ColorSettings.titleBar_inactiveForeground],
  );

  assert.equal(
    config[ColorSettings.commandCenter_foreground],
    config[ColorSettings.titleBar_activeForeground],
  );

  // All others should not exist
  assert.ok(!config[ColorSettings.activityBar_background]);
  assert.ok(!config[ColorSettings.activityBar_foreground]);
  assert.ok(!config[ColorSettings.activityBar_inactiveForeground]);
  assert.ok(!config[ColorSettings.activityBar_activeBackground]);
  // "On top" tokens should also be absent when activity bar is not affected
  assert.ok(!config[ColorSettings.activityBarTop_background]);
  assert.ok(!config[ColorSettings.activityBarTop_foreground]);
  assert.ok(!config[ColorSettings.activityBarTop_inactiveForeground]);
  assert.ok(!config[ColorSettings.activityBarTop_activeBackground]);
  assert.ok(!config[ColorSettings.statusBar_foreground]);
  assert.ok(!config[ColorSettings.statusBar_background]);
  // assert.ok(!config[ColorSettings.activityBar_activeBorder]);

  // reset
  await updateAffectedElements(allAffectedElements);
}

async function testsSetsColorCustomizationsForAffectedElements() {
  await executeCommand(Commands.changeColorToPeacockGreen);
  const config = getColorCustomizationConfig();
  const keepForegroundColor = getKeepForegroundColor();
  const keepBadgeColor = getKeepBadgeColor();

  const titleBarStyle = getElementStyle(peacockGreen, 'titleBar');
  assert.equal(titleBarStyle.backgroundHex, config[ColorSettings.titleBar_activeBackground]);

  assert.ok(
    shouldKeepColorTest(
      titleBarStyle.foregroundHex,
      ColorSettings.titleBar_activeForeground,
      keepForegroundColor,
    ),
  );

  assert.equal(
    titleBarStyle.inactiveBackgroundHex,
    config[ColorSettings.titleBar_inactiveBackground],
  );

  assert.equal(
    config[ColorSettings.commandCenter_border],
    config[ColorSettings.titleBar_inactiveForeground],
  );

  assert.ok(
    shouldKeepColorTest(
      titleBarStyle.inactiveForegroundHex,
      ColorSettings.titleBar_inactiveForeground,
      keepForegroundColor,
    ),
  );

  const activityBarStyle = getElementStyle(peacockGreen, 'activityBar');
  assert.equal(activityBarStyle.backgroundHex, config[ColorSettings.activityBar_background]);
  assert.equal(activityBarStyle.backgroundHex, config[ColorSettings.activityBar_activeBackground]);
  // "On top" layout tokens should mirror classic layout values
  assert.equal(activityBarStyle.backgroundHex, config[ColorSettings.activityBarTop_background]);
  assert.equal(
    activityBarStyle.backgroundHex,
    config[ColorSettings.activityBarTop_activeBackground],
  );

  assert.ok(
    shouldKeepColorTest(
      activityBarStyle.foregroundHex,
      ColorSettings.activityBar_foreground,
      keepForegroundColor,
    ),
  );

  assert.ok(
    shouldKeepColorTest(
      activityBarStyle.inactiveForegroundHex,
      ColorSettings.activityBar_inactiveForeground,
      keepForegroundColor,
    ),
  );

  assert.ok(
    shouldKeepColorTest(
      activityBarStyle.foregroundHex,
      ColorSettings.activityBarTop_foreground,
      keepForegroundColor,
    ),
  );

  assert.ok(
    shouldKeepColorTest(
      activityBarStyle.inactiveForegroundHex,
      ColorSettings.activityBarTop_inactiveForeground,
      keepForegroundColor,
    ),
  );

  assert.ok(
    shouldKeepColorTest(
      activityBarStyle.badgeBackgroundHex,
      ColorSettings.activityBar_badgeBackground,
      keepBadgeColor,
    ),
  );

  assert.ok(
    shouldKeepColorTest(
      activityBarStyle.badgeForegroundHex,
      ColorSettings.activityBar_badgeForeground,
      keepBadgeColor,
    ),
  );

  const statusBarStyle = getElementStyle(peacockGreen, 'statusBar');
  assert.equal(statusBarStyle.backgroundHex, config[ColorSettings.statusBar_background]);

  assert.ok(
    shouldKeepColorTest(
      statusBarStyle.foregroundHex,
      ColorSettings.statusBar_foreground,
      keepForegroundColor,
    ),
  );
}

async function getColorSettingAfterEnterColor(colorInput: string, setting: ColorSettings) {
  // Stub the async input box to return a response
  const stub = await sinon.stub(vscode.window, 'showInputBox').returns(Promise.resolve(colorInput));
  // fire the command
  await vscode.commands.executeCommand(Commands.enterColor);
  const config = getColorCustomizationConfig();
  stub.restore();
  return config[setting];
}

function shouldKeepColorTest(
  elementStyle: string | undefined,
  colorSetting: ColorSettings,
  keepColor: boolean,
) {
  const config = getColorCustomizationConfig();
  const match = elementStyle === config[colorSetting];
  const passesTest = keepColor ? !match : match;
  return passesTest;
}
async function getPeacockWorkspaceConfigAfterEnterColor(colorInput: string) {
  // Stub the async input box to return a response
  const stub = await sinon.stub(vscode.window, 'showInputBox').returns(Promise.resolve(colorInput));

  // fire the command
  await vscode.commands.executeCommand(Commands.enterColor);
  const config = getColorCustomizationConfig();
  stub.restore();

  return config;
}
