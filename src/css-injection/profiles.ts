import { getExcludedSettings, prepareColors } from '../configuration/read-configuration';
import { getBackgroundColorHex } from '../color-library';
import { ISettingsIndexer } from '../models';

export const cssProfileLimit = 128;
export const cssProfileStartPrefix = '/*__PEACOCK_CSS_PROFILE_START__:';
export const cssProfileEndPrefix = '/*__PEACOCK_CSS_PROFILE_END__:';

export interface ICssProfile {
  id: string;
  color: string;
  variables: ISettingsIndexer;
  lastUsed: number;
}

export type CssProfileRegistry = Record<string, ICssProfile>;

/** Builds a CSS profile from the same effective color settings as legacy mode. */
export function createCurrentCssProfile(
  color: string,
  lastUsed = Date.now(),
  overrides: ISettingsIndexer = {},
) {
  const normalizedColor = getBackgroundColorHex(color);
  return createCssProfile(
    normalizedColor,
    { ...prepareColors(normalizedColor), ...overrides },
    getExcludedSettings(),
    lastUsed,
  );
}

/**
 * Removes excluded tokens, converts the rest to VS Code custom properties, and
 * fingerprints the complete resulting style rather than only its base color.
 */
export function createCssProfile(
  color: string,
  colorSettings: ISettingsIndexer,
  excludedSettings: string[] = [],
  lastUsed = Date.now(),
): ICssProfile {
  const cssVariables: ISettingsIndexer = {};
  Object.keys(colorSettings)
    .filter(colorToken => !excludedSettings.includes(colorToken))
    .sort()
    .forEach(colorToken => {
      const colorValue = colorSettings[colorToken];
      if (typeof colorValue === 'string') {
        cssVariables[toCssVariableName(colorToken)] = colorValue;
      }
    });

  const normalizedColor = getBackgroundColorHex(color);
  const canonicalVariables = canonicalizeCssVariables(cssVariables);
  return {
    id: fingerprint(canonicalVariables),
    color: normalizedColor,
    variables: cssVariables,
    lastUsed,
  };
}

/** Merges profiles by fingerprint and retains the most recently used entries. */
export function mergeCssProfiles(
  existingRegistry: CssProfileRegistry,
  incomingProfiles: ICssProfile[],
  limit = cssProfileLimit,
): CssProfileRegistry {
  const mergedRegistry: CssProfileRegistry = { ...existingRegistry };
  incomingProfiles.forEach(profile => {
    const previousProfile = mergedRegistry[profile.id];
    mergedRegistry[profile.id] = {
      ...profile,
      lastUsed: Math.max(previousProfile?.lastUsed || 0, profile.lastUsed),
    };
  });

  const profilesByMostRecentUse = Object.values(mergedRegistry)
    .sort((left, right) => right.lastUsed - left.lastUsed || left.id.localeCompare(right.id))
    .slice(0, Math.max(1, limit));

  return profilesByMostRecentUse.reduce<CssProfileRegistry>((profilesById, profile) => {
    profilesById[profile.id] = profile;
    return profilesById;
  }, {});
}

export function createCssProfileMarkerLabel(profile: ICssProfile) {
  return `Peacock CSS profile ${profile.id}; color ${profile.color}`;
}

/**
 * Selects one profile by matching its status-bar accessibility label. The
 * marker lets multiple windows share one installed stylesheet while choosing
 * different profiles without another file write.
 */
export function generateCssProfileRule(profile: ICssProfile) {
  const accessibilityMarkerLabel = escapeCssString(createCssProfileMarkerLabel(profile));
  const selectedWorkbenchSelector = `body:has([aria-label="${accessibilityMarkerLabel}"]) .monaco-workbench`;
  const customPropertyDeclarations = Object.keys(profile.variables)
    .sort()
    .map(cssVariableName => `${cssVariableName}:${profile.variables[cssVariableName]} !important;`)
    .join('');
  const workbenchSurfaceRules = generateSurfaceRules(profile, selectedWorkbenchSelector);

  return `${cssProfileStartPrefix}${profile.id}__*/${selectedWorkbenchSelector}{${customPropertyDeclarations}}${workbenchSurfaceRules}${cssProfileEndPrefix}${profile.id}__*/`;
}

function toCssVariableName(colorToken: string) {
  return `--vscode-${colorToken.replace(/\./g, '-')}`;
}

/**
 * Workbench parts resolve some theme colors to literal inline styles. Custom
 * properties on the workbench root therefore cannot repaint these surfaces,
 * even with !important. Emit the profile values themselves for those parts;
 * the remaining tokens continue to flow through the --vscode-* declarations.
 */
function generateSurfaceRules(profile: ICssProfile, selectedWorkbenchSelector: string) {
  return [
    createSurfaceRule(profile, `${selectedWorkbenchSelector} .part.titlebar`, [
      ['background-color', '--vscode-titleBar-activeBackground'],
      ['color', '--vscode-titleBar-activeForeground'],
      ['border-color', '--vscode-titleBar-border'],
    ]),
    createSurfaceRule(profile, `${selectedWorkbenchSelector} .part.titlebar.inactive`, [
      ['background-color', '--vscode-titleBar-inactiveBackground'],
      ['color', '--vscode-titleBar-inactiveForeground'],
    ]),
    createSurfaceRule(profile, `${selectedWorkbenchSelector} .part.activitybar`, [
      ['background-color', '--vscode-activityBar-background'],
      ['color', '--vscode-activityBar-foreground'],
    ]),
    createSurfaceRule(profile, `${selectedWorkbenchSelector} .part.statusbar`, [
      ['background-color', '--vscode-statusBar-background'],
      ['color', '--vscode-statusBar-foreground'],
      ['border-color', '--vscode-statusBar-border'],
    ]),
  ].join('');
}

function createSurfaceRule(
  profile: ICssProfile,
  selector: string,
  propertyMappings: [string, string][],
) {
  const declarations = propertyMappings
    .map(([cssProperty, cssVariableName]) => {
      const colorValue = profile.variables[cssVariableName];
      return typeof colorValue === 'string' ? `${cssProperty}:${colorValue} !important;` : '';
    })
    .join('');

  return declarations ? `${selector}{${declarations}}` : '';
}

function canonicalizeCssVariables(cssVariables: ISettingsIndexer) {
  return Object.keys(cssVariables)
    .sort()
    .map(cssVariableName => `${cssVariableName}:${cssVariables[cssVariableName]}`)
    .join(';');
}

/** Produces a stable, compact, non-cryptographic ID for a canonical style. */
function fingerprint(canonicalStyle: string) {
  let firstHash = 0x811c9dc5;
  let secondHash = 0x9e3779b9;
  for (let index = 0; index < canonicalStyle.length; index += 1) {
    const characterCode = canonicalStyle.charCodeAt(index);
    firstHash = Math.imul(firstHash ^ characterCode, 0x01000193);
    secondHash = Math.imul(secondHash ^ characterCode, 0x85ebca6b);
  }
  return `${unsignedHex(firstHash)}${unsignedHex(secondHash)}`;
}

function unsignedHex(hashValue: number) {
  return `00000000${(hashValue >>> 0).toString(16)}`.slice(-8);
}

function escapeCssString(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\a ');
}
