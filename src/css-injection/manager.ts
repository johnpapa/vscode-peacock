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
let modeQueue = Promise.resolve();
let extensionMode = vscode.ExtensionMode.Production;
const reportedDiagnostics = new Set<string>();
const warnedLegacySettings = new Set<string>();
const restartPrompts = new Set<string>();

export function initializeColorApplicationMode(mode = vscode.ExtensionMode.Production) {
  extensionMode = mode;
  return enqueueModeRefresh(false, false);
}

export function refreshColorApplicationMode(forceRepair = false) {
  return enqueueModeRefresh(forceRepair, false);
}

export function isCssColorApplicationActive() {
  return cssModeActive;
}

export function canUseCssInjection(mode: vscode.ExtensionMode) {
  return mode !== vscode.ExtensionMode.Test;
}

export async function installOrRepairCssOverridesHandler() {
  try {
    await updateCssInjectionEnabled(true);
    await enqueueModeRefresh(true, false);
  } catch (error) {
    reportCssFailure(error);
  }
}

export async function removeCssOverridesHandler() {
  try {
    await updateCssInjectionEnabled(false);
    await enqueueModeRefresh(false, true);
  } catch (error) {
    reportCssFailure(error);
  }
}

export async function setStylesheetPathHandler() {
  const cacheKey = getStylesheetCacheKey();
  const existingPath = getCssStylesheetPathsGlobalMemento()[cacheKey] || activeStylesheetPath;
  const selectedPath = await vscode.window.showInputBox({
    prompt: 'Enter the full path to workbench.desktop.main.css',
    value: existingPath,
    ignoreFocusOut: true,
  });
  if (!selectedPath) {
    return;
  }

  if (!(await cssPatcher.validate(selectedPath))) {
    await vscode.window.showErrorMessage(
      'Peacock could not find a workbench.desktop.main.css file at that path.',
    );
    return;
  }

  activeStylesheetPath = selectedPath;
  await saveCssStylesheetPathGlobalMemento(cacheKey, selectedPath);
  if (getCssInjectionEnabled()) {
    await enqueueModeRefresh(true, false);
  }
}

export async function clearAllPrivateCssColors() {
  await clearCssWorkspaceOverridesGlobalMemento();
  transientColor = undefined;
  sessionSideBarBackground = undefined;
  if (cssModeActive) {
    await safelyRenderResolvedCssColor();
  }
}

export function hasActiveWorkspaceMapping() {
  return resolveCurrentCssColor().source === 'workspaceMap';
}

export function resetCssManagerForTests() {
  cssModeActive = false;
  activeStylesheetPath = undefined;
  currentAppliedColor = undefined;
  transientColor = undefined;
  sessionSideBarBackground = undefined;
  modeQueue = Promise.resolve();
  reportedDiagnostics.clear();
  warnedLegacySettings.clear();
  restartPrompts.clear();
  setCssProfileStatusBar(undefined);
  configureColorApplication();
}

function enqueueModeRefresh(forceRepair: boolean, forceRemove: boolean) {
  const operation = async () => {
    if (!canUseCssInjection(extensionMode)) {
      cssModeActive = false;
      configureColorApplication();
    } else if (getCssInjectionEnabled()) {
      await enableCssMode(forceRepair);
    } else if (cssModeActive || forceRemove) {
      await disableCssMode(forceRemove);
    } else {
      configureColorApplication();
    }
  };
  modeQueue = modeQueue.then(operation, operation);
  return modeQueue;
}

async function enableCssMode(forceRepair: boolean) {
  cssModeActive = true;
  configureColorApplication(cssRenderer, cssPersistence);
  setCssProfileStatusBar(undefined);
  if (forceRepair) {
    Logger.info('Peacock is installing or repairing its CSS override block.');
  }

  try {
    if (!(await ensureConsent())) {
      cssModeActive = false;
      configureColorApplication();
      return;
    }

    activeStylesheetPath = await locateStylesheet();
    warnAboutWorkspaceLegacyColor();
    reportWorkspaceMapDiagnostics();

    const resolved = resolveCurrentCssColor();
    if (resolved.color) {
      await renderCssColor(resolved.color);
    } else {
      currentAppliedColor = undefined;
      setCssProfileStatusBar(undefined);
      await installRegistry(getCssProfilesGlobalMemento());
    }
  } catch (error) {
    currentAppliedColor = undefined;
    setCssProfileStatusBar(undefined);
    reportCssFailure(error);
  }
}

async function disableCssMode(forceRemove: boolean) {
  transientColor = undefined;
  sessionSideBarBackground = undefined;
  currentAppliedColor = undefined;
  setCssProfileStatusBar(undefined);

  try {
    const cssPath = activeStylesheetPath || (forceRemove ? await locateStylesheet() : undefined);
    if (cssPath) {
      const result = await cssPatcher.remove(cssPath);
      if (result.changed) {
        promptForRestart(cssPath);
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

  const selected = await vscode.window.showWarningMessage(
    consentMessage,
    { modal: true },
    consentAction,
  );
  if (selected !== consentAction) {
    await updateCssInjectionEnabled(false);
    return false;
  }

  await saveCssInjectionConsentGlobalMemento(true);
  return true;
}

async function locateStylesheet() {
  const cacheKey = getStylesheetCacheKey();
  const cachedPath = getCssStylesheetPathsGlobalMemento()[cacheKey];
  const cssPath = await cssPatcher.locate(activeStylesheetPath || cachedPath);
  if (!cssPath) {
    throw new Error(
      'Peacock could not locate workbench.desktop.main.css. Use “Peacock: Set VS Code Stylesheet Path” and try again.',
    );
  }
  await saveCssStylesheetPathGlobalMemento(cacheKey, cssPath);
  return cssPath;
}

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
  if (vscode.env.remoteName) {
    return getPeacockRemoteColor() || getPeacockColor();
  }
  return getPeacockColor();
}

function resolveCurrentCssColor() {
  const hasWorkspace = !!vscode.workspace.workspaceFolders;
  return resolveWorkspaceColor({
    identity: getCurrentWorkspaceIdentity(),
    workspaces: getPeacockWorkspaces(),
    transientColor,
    privateColor: getPrivateWorkspaceOverride()?.color,
    legacyColor: hasWorkspace ? getLegacyFallbackColor() : undefined,
  });
}

async function renderResolvedCssColor() {
  const resolved = resolveCurrentCssColor();
  reportWorkspaceMapDiagnostics();
  if (resolved.color) {
    return await renderCssColor(resolved.color);
  }
  currentAppliedColor = undefined;
  setCssProfileStatusBar(undefined);
  return undefined;
}

async function safelyRenderResolvedCssColor() {
  try {
    return await renderResolvedCssColor();
  } catch (error) {
    currentAppliedColor = undefined;
    setCssProfileStatusBar(undefined);
    reportCssFailure(error);
    return undefined;
  }
}

async function safelyRenderCssColor(color: string) {
  try {
    return await renderCssColor(color);
  } catch (error) {
    currentAppliedColor = undefined;
    setCssProfileStatusBar(undefined);
    reportCssFailure(error);
    return undefined;
  }
}

async function renderCssColor(color: string) {
  if (!activeStylesheetPath) {
    activeStylesheetPath = await locateStylesheet();
  }

  const sideBarBackground =
    getPrivateWorkspaceOverride()?.sideBarBackground || sessionSideBarBackground;
  const overrides = sideBarBackground ? { 'sideBar.background': sideBarBackground } : {};
  const profile = createCurrentCssProfile(color, Date.now(), overrides);
  if (!profile) {
    currentAppliedColor = undefined;
    setCssProfileStatusBar(undefined);
    return undefined;
  }

  const registry = mergeCssProfiles(getCssProfilesGlobalMemento(), [profile]);
  await saveCssProfilesGlobalMemento(registry);
  await installRegistry(registry);
  currentAppliedColor = profile.color;
  setCssProfileStatusBar(profile);
  return profile.color;
}

async function installRegistry(registry: ReturnType<typeof getCssProfilesGlobalMemento>) {
  if (!activeStylesheetPath) {
    activeStylesheetPath = await locateStylesheet();
  }
  const result = await cssPatcher.install(activeStylesheetPath, registry);
  if (result.changed) {
    promptForRestart(result.path);
  }
}

function promptForRestart(cssPath: string) {
  if (restartPrompts.has(cssPath)) {
    return;
  }
  restartPrompts.add(cssPath);
  void vscode.window
    .showInformationMessage(
      'Peacock updated the VS Code stylesheet. Fully quit and reopen VS Code to activate the CSS overrides.',
      quitAction,
      'Later',
    )
    .then(selected => {
      if (selected === quitAction) {
        void vscode.commands.executeCommand('workbench.action.quit');
      }
    });
}

function reportWorkspaceMapDiagnostics() {
  const resolved = resolveCurrentCssColor();
  if (resolved.ambiguousNames.length) {
    reportDiagnostic(
      `ambiguous:${resolved.ambiguousNames.join('|')}`,
      `Peacock ignored ambiguous workspace mappings: ${resolved.ambiguousNames.join(
        ', ',
      )}. Their exact path aliases all match this workspace.`,
    );
  }
  if (resolved.invalidNames.length) {
    reportDiagnostic(
      `invalid:${resolved.invalidNames.join('|')}`,
      `Peacock ignored invalid workspace mappings: ${resolved.invalidNames.join(
        ', ',
      )}. Each effective entry needs a non-empty path array and valid color.`,
    );
  }
}

function reportDiagnostic(key: string, message: string) {
  if (reportedDiagnostics.has(key)) {
    return;
  }
  reportedDiagnostics.add(key);
  void vscode.window.showWarningMessage(message);
  Logger.info(message);
}

function warnAboutWorkspaceLegacyColor() {
  const settings = [StandardSettings.Color, StandardSettings.RemoteColor];
  for (const setting of settings) {
    const section = `peacock.${setting}`;
    const inspection = vscode.workspace.getConfiguration().inspect<string>(section);
    const hasWorkspaceValue = !!inspection?.workspaceValue || !!inspection?.workspaceFolderValue;
    if (!hasWorkspaceValue || warnedLegacySettings.has(section)) {
      continue;
    }
    warnedLegacySettings.add(section);
    void vscode.window.showWarningMessage(
      `${section} is defined in this workspace. CSS injection leaves it untouched and uses it only as a fallback; Peacock command selections and exact workspace mappings take precedence.`,
    );
  }
}

function reportCssFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  Logger.info(`Peacock CSS injection failed: ${message}`);
  void vscode.window.showErrorMessage(
    `Peacock CSS injection failed without changing workspace settings: ${message}`,
  );
}

const cssRenderer: IColorRenderer = {
  async apply(color, options) {
    if (options?.transient) {
      transientColor = color;
    }
    const selectedColor = transientColor || color;
    try {
      return await renderCssColor(selectedColor);
    } catch (error) {
      currentAppliedColor = undefined;
      setCssProfileStatusBar(undefined);
      reportCssFailure(error);
      return undefined;
    }
  },

  async unapply() {
    transientColor = undefined;
    currentAppliedColor = undefined;
    setCssProfileStatusBar(undefined);
  },

  async capture() {
    return { appliedColor: currentAppliedColor };
  },

  async restore(state: unknown) {
    transientColor = undefined;
    const resolved = resolveCurrentCssColor();
    const captured = state as { appliedColor?: string } | undefined;
    const color = resolved.color || captured?.appliedColor;
    if (color) {
      await safelyRenderCssColor(color);
    } else {
      await this.unapply();
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
      const existing = getPrivateWorkspaceOverride() || {};
      await saveCssWorkspaceOverrideGlobalMemento(identity.key, {
        ...existing,
        sideBarBackground: color,
      });
    } else {
      sessionSideBarBackground = color;
    }
    await safelyRenderResolvedCssColor();
  },
};

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
    const existing = getPrivateWorkspaceOverride() || {};
    await saveCssWorkspaceOverrideGlobalMemento(identity.key, {
      ...existing,
      color: normalizedColor,
    });
  },

  async clearWorkspace() {
    const identity = getCurrentWorkspaceIdentity();
    if (identity) {
      await saveCssWorkspaceOverrideGlobalMemento(identity.key, undefined);
    }
    await safelyRenderResolvedCssColor();
  },

  getCurrent() {
    return resolveCurrentCssColor().color || currentAppliedColor;
  },
};
