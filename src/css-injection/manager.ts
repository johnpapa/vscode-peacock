import * as vscode from 'vscode';

import { configureColorApplication, IColorPersistence, IColorRenderer } from '../apply-color';
import { getBackgroundColorHex, isValidColorInput } from '../color-library';
import {
  getCssInjectionEnabled,
  getPeacockColor,
  getPeacockRemoteColor,
  getPeacockWorkspaces,
  resolveWorkspaceColor,
  getCurrentWorkspaceIdentity,
  updateCssInjectionEnabled,
} from '../configuration';
import { Logger } from '../logging';
import { StandardSettings } from '../models';
import {
  clearCssWorkspaceOverridesGlobalMemento,
  getCssInjectionConsentGlobalMemento,
  getCssProfilesGlobalMemento,
  getCssStylesheetPathsGlobalMemento,
  getCssWorkspaceOverridesGlobalMemento,
  saveCssInjectionConsentGlobalMemento,
  saveCssProfilesGlobalMemento,
  saveCssStylesheetPathGlobalMemento,
  saveCssWorkspaceOverrideGlobalMemento,
} from '../mementos';
import { setCssProfileStatusBar } from '../statusbar';
import { cssPatcher } from './css-patcher-platform';
import { createCurrentCssProfile, mergeCssProfiles } from './profiles';

const consentAction = 'Enable CSS Injection';
const quitAction = 'Quit VS Code';
const consentMessage =
  "Peacock's CSS renderer modifies VS Code's installed workbench stylesheet. VS Code will report that its installation is modified or corrupt, and an update may remove the override. Continue only if you accept this.";

let cssModeActive = false;
let activeStylesheetPath: string | undefined;
let currentAppliedColor: string | undefined;
let transientColor: string | undefined;
let sessionSideBarBackground: string | undefined;
let modeRefreshQueue = Promise.resolve();
let extensionMode = vscode.ExtensionMode.Production;
const reportedWorkspaceDiagnostics = new Set<string>();
const warnedLegacySettings = new Set<string>();
const restartPromptedStylesheetPaths = new Set<string>();

export function initializeColorApplicationMode(mode: vscode.ExtensionMode) {
  extensionMode = mode;
  return enqueueModeRefresh();
}

export function refreshColorApplicationMode() {
  return enqueueModeRefresh();
}

export function isCssColorApplicationActive() {
  return cssModeActive;
}

export async function installOrRepairCssOverridesHandler() {
  try {
    Logger.info('Peacock is installing or repairing its CSS override block.');
    await updateCssInjectionEnabled(true);
    await enqueueModeRefresh();
  } catch (error) {
    reportCssFailure(error);
  }
}

export async function removeCssOverridesHandler() {
  try {
    await updateCssInjectionEnabled(false);
    await enqueueModeRefresh(true);
  } catch (error) {
    reportCssFailure(error);
  }
}

export async function setStylesheetPathHandler() {
  const stylesheetCacheKey = getStylesheetCacheKey();
  const existingStylesheetPath =
    activeStylesheetPath || getCssStylesheetPathsGlobalMemento()[stylesheetCacheKey];
  const selectedStylesheetPath = (
    await vscode.window.showInputBox({
      prompt: 'Enter the full path to workbench.desktop.main.css',
      value: existingStylesheetPath,
      ignoreFocusOut: true,
    })
  )?.trim();
  if (!selectedStylesheetPath) {
    return;
  }

  if (!(await cssPatcher.validate(selectedStylesheetPath))) {
    await vscode.window.showErrorMessage(
      'Peacock could not find a workbench.desktop.main.css file at that path.',
    );
    return;
  }

  activeStylesheetPath = selectedStylesheetPath;
  await saveCssStylesheetPathGlobalMemento(stylesheetCacheKey, selectedStylesheetPath);
  if (getCssInjectionEnabled()) {
    await enqueueModeRefresh();
  }
}

export async function clearAllPrivateCssColors() {
  await clearCssWorkspaceOverridesGlobalMemento();
  transientColor = undefined;
  sessionSideBarBackground = undefined;
}

export function hasActiveWorkspaceMapping() {
  return resolveCurrentCssColor().source === 'workspaceMap';
}

/** Serializes mode changes so concurrent configuration events cannot race file writes. */
function enqueueModeRefresh(removeEvenWhenInactive = false) {
  const refreshOperation = async () => {
    if (extensionMode === vscode.ExtensionMode.Test) {
      cssModeActive = false;
      configureColorApplication();
    } else if (getCssInjectionEnabled()) {
      await enableCssMode();
    } else if (cssModeActive || removeEvenWhenInactive) {
      await disableCssMode(removeEvenWhenInactive);
    } else {
      configureColorApplication();
    }
  };
  modeRefreshQueue = modeRefreshQueue.then(refreshOperation, refreshOperation);
  return modeRefreshQueue;
}

async function enableCssMode() {
  cssModeActive = true;
  configureColorApplication(cssRenderer, cssPersistence);
  clearCssProfile();
  try {
    if (!(await ensureConsent())) {
      cssModeActive = false;
      configureColorApplication();
      return;
    }

    activeStylesheetPath = await locateStylesheet();
    warnAboutWorkspaceLegacyColor();

    const resolvedColor = resolveCurrentCssColor();
    reportWorkspaceMapDiagnostics(resolvedColor);
    if (resolvedColor.color) {
      await renderCssColor(resolvedColor.color);
    } else {
      clearCssProfile();
      await installRegistry(getCssProfilesGlobalMemento());
    }
  } catch (error) {
    clearCssProfile();
    reportCssFailure(error);
  }
}

async function disableCssMode(removeEvenWhenInactive: boolean) {
  transientColor = undefined;
  sessionSideBarBackground = undefined;
  clearCssProfile();

  try {
    const stylesheetPath =
      activeStylesheetPath || (removeEvenWhenInactive ? await locateStylesheet() : undefined);
    if (stylesheetPath) {
      if (await cssPatcher.remove(stylesheetPath)) {
        promptForRestart(stylesheetPath);
      }
    }
  } catch (error) {
    reportCssFailure(error);
  } finally {
    cssModeActive = false;
    configureColorApplication();
  }
}

async function ensureConsent() {
  if (getCssInjectionConsentGlobalMemento()) {
    return true;
  }

  const selectedAction = await vscode.window.showWarningMessage(
    consentMessage,
    { modal: true },
    consentAction,
  );
  if (selectedAction !== consentAction) {
    await updateCssInjectionEnabled(false);
    return false;
  }

  await saveCssInjectionConsentGlobalMemento(true);
  return true;
}

/** Discovers the installed workbench stylesheet and caches it per VS Code app root. */
async function locateStylesheet() {
  const stylesheetCacheKey = getStylesheetCacheKey();
  const cachedStylesheetPath = getCssStylesheetPathsGlobalMemento()[stylesheetCacheKey];
  const stylesheetPath = await cssPatcher.locate(activeStylesheetPath || cachedStylesheetPath);
  if (!stylesheetPath) {
    throw new Error(
      'Peacock could not locate workbench.desktop.main.css. Use “Peacock: Set VS Code Stylesheet Path” and try again.',
    );
  }
  await saveCssStylesheetPathGlobalMemento(stylesheetCacheKey, stylesheetPath);
  return stylesheetPath;
}

/** Separates cached paths for different VS Code installations on one machine. */
function getStylesheetCacheKey() {
  return `${vscode.env.machineId}:${vscode.env.appName || 'vscode'}:${
    vscode.env.appRoot || 'unknown'
  }`;
}

function getPrivateWorkspaceOverride() {
  const identity = getCurrentWorkspaceIdentity();
  return identity ? getCssWorkspaceOverridesGlobalMemento()[identity.key] : undefined;
}

function getLegacyFallbackColor() {
  return vscode.env.remoteName ? getPeacockRemoteColor() || getPeacockColor() : getPeacockColor();
}

/** Resolves the active color using Peacock's documented CSS-mode precedence. */
function resolveCurrentCssColor() {
  const hasWorkspaceFolders = !!vscode.workspace.workspaceFolders;
  return resolveWorkspaceColor({
    identity: getCurrentWorkspaceIdentity(),
    workspaces: getPeacockWorkspaces(),
    transientColor,
    privateColor: getPrivateWorkspaceOverride()?.color,
    legacyColor: hasWorkspaceFolders ? getLegacyFallbackColor() : undefined,
  });
}

function clearCssProfile() {
  currentAppliedColor = undefined;
  setCssProfileStatusBar(undefined);
}

/** Reports failures without falling back to workspace-setting writes. */
async function safelyRenderCssColor(requestedColor?: string) {
  try {
    let colorToRender = requestedColor;
    if (!colorToRender) {
      const resolvedColor = resolveCurrentCssColor();
      reportWorkspaceMapDiagnostics(resolvedColor);
      colorToRender = resolvedColor.color;
    }
    if (colorToRender) {
      await renderCssColor(colorToRender);
    } else {
      clearCssProfile();
    }
    return currentAppliedColor;
  } catch (error) {
    clearCssProfile();
    reportCssFailure(error);
  }
}

/** Installs the profile before publishing the status-bar marker that selects it. */
async function renderCssColor(color: string) {
  const sideBarBackground =
    getPrivateWorkspaceOverride()?.sideBarBackground || sessionSideBarBackground;
  const tokenOverrides = sideBarBackground ? { 'sideBar.background': sideBarBackground } : {};
  const cssProfile = createCurrentCssProfile(color, Date.now(), tokenOverrides);
  const profileRegistry = mergeCssProfiles(getCssProfilesGlobalMemento(), [cssProfile]);
  await saveCssProfilesGlobalMemento(profileRegistry);
  await installRegistry(profileRegistry);
  currentAppliedColor = cssProfile.color;
  setCssProfileStatusBar(cssProfile);
}

async function installRegistry(profileRegistry: ReturnType<typeof getCssProfilesGlobalMemento>) {
  if (!activeStylesheetPath) {
    activeStylesheetPath = await locateStylesheet();
  }
  if (await cssPatcher.install(activeStylesheetPath, profileRegistry)) {
    promptForRestart(activeStylesheetPath);
  }
}

function promptForRestart(stylesheetPath: string) {
  if (restartPromptedStylesheetPaths.has(stylesheetPath)) {
    return;
  }
  restartPromptedStylesheetPaths.add(stylesheetPath);
  void vscode.window
    .showInformationMessage(
      'Peacock updated the VS Code stylesheet. Fully quit and reopen VS Code to activate the CSS overrides.',
      quitAction,
      'Later',
    )
    .then(selectedAction => {
      if (selectedAction === quitAction) {
        void vscode.commands.executeCommand('workbench.action.quit');
      }
    });
}

function reportWorkspaceMapDiagnostics(resolvedColor = resolveCurrentCssColor()) {
  if (resolvedColor.ambiguousNames.length) {
    reportDiagnostic(
      `ambiguous:${resolvedColor.ambiguousNames.join('|')}`,
      `Peacock ignored ambiguous workspace mappings: ${resolvedColor.ambiguousNames.join(
        ', ',
      )}. Their exact path aliases all match this workspace.`,
    );
  }
  if (resolvedColor.invalidNames.length) {
    reportDiagnostic(
      `invalid:${resolvedColor.invalidNames.join('|')}`,
      `Peacock ignored invalid workspace mappings: ${resolvedColor.invalidNames.join(
        ', ',
      )}. Each effective entry needs a non-empty path array and valid color.`,
    );
  }
}

function reportDiagnostic(diagnosticKey: string, message: string) {
  if (reportedWorkspaceDiagnostics.has(diagnosticKey)) {
    return;
  }
  reportedWorkspaceDiagnostics.add(diagnosticKey);
  void vscode.window.showWarningMessage(message);
  Logger.info(message);
}

function warnAboutWorkspaceLegacyColor() {
  const legacyColorSettings = [StandardSettings.Color, StandardSettings.RemoteColor];
  for (const setting of legacyColorSettings) {
    const settingSection = `peacock.${setting}`;
    const settingInspection = vscode.workspace.getConfiguration().inspect<string>(settingSection);
    const hasWorkspaceValue =
      !!settingInspection?.workspaceValue || !!settingInspection?.workspaceFolderValue;
    if (!hasWorkspaceValue || warnedLegacySettings.has(settingSection)) {
      continue;
    }
    warnedLegacySettings.add(settingSection);
    void vscode.window.showWarningMessage(
      `${settingSection} is defined in this workspace. CSS injection leaves it untouched and uses it only as a fallback; Peacock command selections and exact workspace mappings take precedence.`,
    );
  }
}

function reportCssFailure(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  Logger.info(`Peacock CSS injection failed: ${errorMessage}`);
  void vscode.window.showErrorMessage(
    `Peacock CSS injection failed without changing workspace settings: ${errorMessage}`,
  );
}

/** Implements rendering without reading or writing workbench color customizations. */
const cssRenderer: IColorRenderer = {
  async apply(color, options) {
    if (options?.transient) {
      transientColor = color;
    }
    return await safelyRenderCssColor(transientColor || color);
  },

  async unapply() {
    transientColor = undefined;
    clearCssProfile();
  },

  async capture() {
    return { appliedColor: currentAppliedColor };
  },

  async restore(renderState: unknown) {
    transientColor = undefined;
    const resolvedColor = resolveCurrentCssColor();
    const capturedState = renderState as { appliedColor?: string } | undefined;
    const colorToRestore = resolvedColor.color || capturedState?.appliedColor;
    if (colorToRestore) {
      await safelyRenderCssColor(colorToRestore);
    } else {
      clearCssProfile();
    }
  },

  getAppliedColor() {
    return currentAppliedColor;
  },

  getSideBarBackground() {
    return getPrivateWorkspaceOverride()?.sideBarBackground || sessionSideBarBackground;
  },

  async updateSideBarBackground(color) {
    const identity = getCurrentWorkspaceIdentity();
    if (identity) {
      const existingOverride = getPrivateWorkspaceOverride() || {};
      await saveCssWorkspaceOverrideGlobalMemento(identity.key, {
        ...existingOverride,
        sideBarBackground: color,
      });
    } else {
      sessionSideBarBackground = color;
    }
    await safelyRenderCssColor();
  },
};

/** Persists command-selected colors privately under the exact workspace key. */
const cssPersistence: IColorPersistence = {
  async save(color) {
    const identity = getCurrentWorkspaceIdentity();
    if (!identity) {
      await vscode.window.showWarningMessage(
        'Peacock applied this color for the current session but cannot save it privately because this window has no exact folder or saved workspace identity.',
      );
      return;
    }

    const normalizedColor = isValidColorInput(color) ? getBackgroundColorHex(color) : undefined;
    const existingOverride = getPrivateWorkspaceOverride() || {};
    await saveCssWorkspaceOverrideGlobalMemento(identity.key, {
      ...existingOverride,
      color: normalizedColor,
    });
  },

  async clearWorkspace() {
    const identity = getCurrentWorkspaceIdentity();
    if (identity) {
      await saveCssWorkspaceOverrideGlobalMemento(identity.key, undefined);
    }
    await safelyRenderCssColor();
  },

  getCurrent() {
    return resolveCurrentCssColor().color || currentAppliedColor;
  },
};
