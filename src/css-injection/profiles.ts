import { getExcludedSettings, prepareColors } from '../configuration/read-configuration';
import { getBackgroundColorHex, isValidColorInput } from '../color-library';
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

export function createCurrentCssProfile(
  color: string,
  lastUsed = Date.now(),
  overrides: ISettingsIndexer = {},
) {
  if (!isValidColorInput(color)) {
    return undefined;
  }

  const normalizedColor = getBackgroundColorHex(color);
  return createCssProfile(
    normalizedColor,
    { ...prepareColors(normalizedColor), ...overrides },
    getExcludedSettings(),
    lastUsed,
  );
}

export function createCssProfile(
  color: string,
  colorSettings: ISettingsIndexer,
  excludedSettings: string[] = [],
  lastUsed = Date.now(),
): ICssProfile {
  const variables: ISettingsIndexer = {};
  Object.keys(colorSettings)
    .filter(setting => !excludedSettings.includes(setting))
    .sort()
    .forEach(setting => {
      const value = colorSettings[setting];
      if (typeof value === 'string') {
        variables[toCssVariableName(setting)] = value;
      }
    });

  const normalizedColor = getBackgroundColorHex(color);
  const canonical = canonicalizeCssVariables(variables);
  return {
    id: fingerprint(canonical),
    color: normalizedColor,
    variables,
    lastUsed,
  };
}

export function mergeCssProfiles(
  registry: CssProfileRegistry,
  profiles: ICssProfile[],
  limit = cssProfileLimit,
): CssProfileRegistry {
  const merged: CssProfileRegistry = { ...registry };
  profiles.forEach(profile => {
    const previous = merged[profile.id];
    merged[profile.id] = {
      ...profile,
      lastUsed: Math.max(previous?.lastUsed || 0, profile.lastUsed),
    };
  });

  const retained = Object.values(merged)
    .sort((left, right) => right.lastUsed - left.lastUsed || left.id.localeCompare(right.id))
    .slice(0, Math.max(1, limit));

  return retained.reduce<CssProfileRegistry>((result, profile) => {
    result[profile.id] = profile;
    return result;
  }, {});
}

export function createCssProfileMarkerLabel(profile: ICssProfile) {
  return `Peacock CSS profile ${profile.id}; color ${profile.color}`;
}

export function generateCssProfileRule(profile: ICssProfile) {
  const markerLabel = escapeCssString(createCssProfileMarkerLabel(profile));
  const rootSelector = `body:has([aria-label="${markerLabel}"]) .monaco-workbench`;
  const declarations = Object.keys(profile.variables)
    .sort()
    .map(variable => `${variable}:${profile.variables[variable]} !important;`)
    .join('');
  const surfaceRules = generateSurfaceRules(profile, rootSelector);

  return `${cssProfileStartPrefix}${profile.id}__*/${rootSelector}{${declarations}}${surfaceRules}${cssProfileEndPrefix}${profile.id}__*/`;
}

export function generateCssProfileRules(registry: CssProfileRegistry) {
  return Object.values(registry)
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(generateCssProfileRule)
    .join('');
}

function toCssVariableName(setting: string) {
  return `--vscode-${setting.replace(/\./g, '-')}`;
}

/**
 * Workbench parts resolve some theme colors to literal inline styles. Custom
 * properties on the workbench root therefore cannot repaint these surfaces,
 * even with !important. Emit the profile values themselves for those parts;
 * the remaining tokens continue to flow through the --vscode-* declarations.
 */
function generateSurfaceRules(profile: ICssProfile, rootSelector: string) {
  return [
    createSurfaceRule(profile, `${rootSelector} .part.titlebar`, [
      ['background-color', '--vscode-titleBar-activeBackground'],
      ['color', '--vscode-titleBar-activeForeground'],
      ['border-color', '--vscode-titleBar-border'],
    ]),
    createSurfaceRule(profile, `${rootSelector} .part.titlebar.inactive`, [
      ['background-color', '--vscode-titleBar-inactiveBackground'],
      ['color', '--vscode-titleBar-inactiveForeground'],
    ]),
    createSurfaceRule(profile, `${rootSelector} .part.activitybar`, [
      ['background-color', '--vscode-activityBar-background'],
      ['color', '--vscode-activityBar-foreground'],
    ]),
    createSurfaceRule(profile, `${rootSelector} .part.statusbar`, [
      ['background-color', '--vscode-statusBar-background'],
      ['color', '--vscode-statusBar-foreground'],
      ['border-color', '--vscode-statusBar-border'],
    ]),
  ].join('');
}

function createSurfaceRule(profile: ICssProfile, selector: string, properties: [string, string][]) {
  const declarations = properties
    .map(([property, variable]) => {
      const value = profile.variables[variable];
      return typeof value === 'string' ? `${property}:${value} !important;` : '';
    })
    .join('');

  return declarations ? `${selector}{${declarations}}` : '';
}

function canonicalizeCssVariables(variables: ISettingsIndexer) {
  return Object.keys(variables)
    .sort()
    .map(name => `${name}:${variables[name]}`)
    .join(';');
}

function fingerprint(value: string) {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const character = value.charCodeAt(index);
    first = Math.imul(first ^ character, 0x01000193);
    second = Math.imul(second ^ character, 0x85ebca6b);
  }
  return `${unsignedHex(first)}${unsignedHex(second)}`;
}

function unsignedHex(value: number) {
  return `00000000${(value >>> 0).toString(16)}`.slice(-8);
}

function escapeCssString(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\a ');
}
