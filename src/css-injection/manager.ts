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
  const cacheKey = getStylesheetCacheKey();
  const existingPath = activeStylesheetPath || getCssStylesheetPathsGlobalMemento()[cacheKey];
  const selectedPath = (
    await vscode.window.showInputBox({
      prompt: 'Enter the full path to workbench.desktop.main.css',
      value: existingPath,
      ignoreFocusOut: true,
    })
  )?.trim();
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

function enqueueModeRefresh(forceRemove = false) {
  const operation = async () => {
    if (extensionMode === vscode.ExtensionMode.Test) {
      cssModeActive = false;
      configureColorApplication();
    } else if (getCssInjectionEnabled()) {
      await enableCssMode();
    } else if (cssModeActive || forceRemove) {
      await disableCssMode(forceRemove);
    } else {
      configureColorApplication();
    }
  };
  modeQueue = modeQueue.then(operation, operation);
  return modeQueue;
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

    const resolved = resolveCurrentCssColor();
    reportWorkspaceMapDiagnostics(resolved);
    if (resolved.color) {
      await renderCssColor(resolved.color);
    } else {
      clearCssProfile();
      await installRegistry(getCssProfilesGlobalMemento());
    }
  } catch (error) {
    clearCssProfile();
    reportCssFailure(error);
  }
}

async function disableCssMode(forceRemove: boolean) {
  transientColor = undefined;
  sessionSideBarBackground = undefined;
  clearCssProfile();

  try {
    const cssPath = activeStylesheetPath || (forceRemove ? await locateStylesheet() : undefined);
    if (cssPath) {
      if (await cssPatcher.remove(cssPath)) {
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
  return vscode.env.remoteName ? getPeacockRemoteColor() || getPeacockColor() : getPeacockColor();
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

function clearCssProfile() {
  currentAppliedColor = undefined;
  setCssProfileStatusBar(undefined);
}

async function safelyRenderCssColor(color?: string) {
  try {
    if (!color) {
      const resolved = resolveCurrentCssColor();
      reportWorkspaceMapDiagnostics(resolved);
      color = resolved.color;
    }
    if (color) {
      await renderCssColor(color);
    } else {
      clearCssProfile();
    }
    return currentAppliedColor;
  } catch (error) {
    clearCssProfile();
    reportCssFailure(error);
  }
}

async function renderCssColor(color: string) {
  const sideBarBackground =
    getPrivateWorkspaceOverride()?.sideBarBackground || sessionSideBarBackground;
  const overrides = sideBarBackground ? { 'sideBar.background': sideBarBackground } : {};
  const profile = createCurrentCssProfile(color, Date.now(), overrides);
  const registry = mergeCssProfiles(getCssProfilesGlobalMemento(), [profile]);
  await saveCssProfilesGlobalMemento(registry);
  await installRegistry(registry);
  currentAppliedColor = profile.color;
  setCssProfileStatusBar(profile);
}

async function installRegistry(registry: ReturnType<typeof getCssProfilesGlobalMemento>) {
  if (!activeStylesheetPath) {
    activeStylesheetPath = await locateStylesheet();
  }
  if (await cssPatcher.install(activeStylesheetPath, registry)) {
    promptForRestart(activeStylesheetPath);
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

function reportWorkspaceMapDiagnostics(resolved = resolveCurrentCssColor()) {
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
    return await safelyRenderCssColor(transientColor || color);
  },

  async unapply() {
    transientColor = undefined;
    clearCssProfile();
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
      const existing = getPrivateWorkspaceOverride() || {};
      await saveCssWorkspaceOverrideGlobalMemento(identity.key, {
        ...existing,
        sideBarBackground: color,
      });
    } else {
      sessionSideBarBackground = color;
    }
    await safelyRenderCssColor();
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
    await safelyRenderCssColor();
  },

  getCurrent() {
    return resolveCurrentCssColor().color || currentAppliedColor;
  },
};
