import {
  cssProfileEndPrefix,
  cssProfileLimit,
  cssProfileStartPrefix,
  CssProfileRegistry,
  generateCssProfileRule,
} from './profiles';

export const cssPatchStart = '/*__PEACOCK_CSS_OVERRIDE_START__*/';
export const cssPatchEnd = '/*__PEACOCK_CSS_OVERRIDE_END__*/';

export class CssPatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CssPatchError';
  }
}

export interface IStylesheetParts {
  before: string;
  block?: string;
  after: string;
}

export interface IStylesheetChange {
  content: string;
  changed: boolean;
}

/**
 * Splits out Peacock's one owned block without modifying surrounding bytes.
 * Partial, reversed, or duplicated sentinels are rejected rather than guessed.
 */
export function parseStylesheet(stylesheetContent: string): IStylesheetParts {
  const startMarkerIndex = stylesheetContent.indexOf(cssPatchStart);
  const endMarkerIndex = stylesheetContent.indexOf(cssPatchEnd);

  if (startMarkerIndex === -1 && endMarkerIndex === -1) {
    return { before: stylesheetContent, after: '' };
  }

  if (
    startMarkerIndex === -1 ||
    endMarkerIndex === -1 ||
    startMarkerIndex !== stylesheetContent.lastIndexOf(cssPatchStart) ||
    endMarkerIndex !== stylesheetContent.lastIndexOf(cssPatchEnd) ||
    endMarkerIndex < startMarkerIndex
  ) {
    throw new CssPatchError(
      'The Peacock CSS override block is malformed or appears more than once. No changes were made.',
    );
  }

  const ownedBlockEndIndex = endMarkerIndex + cssPatchEnd.length;
  return {
    before: stylesheetContent.slice(0, startMarkerIndex),
    block: stylesheetContent.slice(startMarkerIndex, ownedBlockEndIndex),
    after: stylesheetContent.slice(ownedBlockEndIndex),
  };
}

/** Extracts complete profile rules and rejects any unaccounted profile marker. */
export function extractCssProfileRules(peacockBlock: string | undefined) {
  const profileRules: Record<string, string> = {};
  if (!peacockBlock) {
    return profileRules;
  }

  const profilePattern = new RegExp(
    `${escapeRegExp(cssProfileStartPrefix)}([a-f\\d]{16})__\\*/[\\s\\S]*?${escapeRegExp(
      cssProfileEndPrefix,
    )}\\1__\\*/`,
    'g',
  );
  let profileMatch: RegExpExecArray | null;
  while ((profileMatch = profilePattern.exec(peacockBlock))) {
    const profileId = profileMatch[1];
    if (profileRules[profileId]) {
      throw new CssPatchError('A Peacock CSS profile is duplicated. No changes were made.');
    }
    profileRules[profileId] = profileMatch[0];
  }

  const profileCount = Object.keys(profileRules).length;
  const profileStartMarkerCount = peacockBlock.split(cssProfileStartPrefix).length - 1;
  const profileEndMarkerCount = peacockBlock.split(cssProfileEndPrefix).length - 1;
  if (profileStartMarkerCount !== profileCount || profileEndMarkerCount !== profileCount) {
    throw new CssPatchError('The Peacock CSS profile list is malformed. No changes were made.');
  }

  return profileRules;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Adds or replaces Peacock's block while retaining profiles installed by
 * other windows and preserving all non-Peacock stylesheet content verbatim.
 */
export function installCssProfiles(
  stylesheetContent: string,
  profileRegistry: CssProfileRegistry,
  profileLimit = cssProfileLimit,
): IStylesheetChange {
  const stylesheetParts = parseStylesheet(stylesheetContent);
  const existingProfileRules = extractCssProfileRules(stylesheetParts.block);
  const incomingProfileRules = Object.values(profileRegistry).reduce<Record<string, string>>(
    (generatedRules, profile) => {
      generatedRules[profile.id] = generateCssProfileRule(profile);
      return generatedRules;
    },
    {},
  );
  const selectedProfileIds = selectProfileIds(
    existingProfileRules,
    incomingProfileRules,
    profileLimit,
  );
  const serializedProfileRules = selectedProfileIds
    .map(profileId => incomingProfileRules[profileId] || existingProfileRules[profileId])
    .join('');
  const peacockBlock = `${cssPatchStart}${serializedProfileRules}${cssPatchEnd}`;
  const updatedContent = `${stylesheetParts.before}${peacockBlock}${stylesheetParts.after}`;

  return {
    content: updatedContent,
    changed: updatedContent !== stylesheetContent,
  };
}

export function removeCssPatch(stylesheetContent: string): IStylesheetChange {
  const stylesheetParts = parseStylesheet(stylesheetContent);
  if (!stylesheetParts.block) {
    return { content: stylesheetContent, changed: false };
  }
  extractCssProfileRules(stylesheetParts.block);

  return {
    content: `${stylesheetParts.before}${stylesheetParts.after}`,
    changed: true,
  };
}

/** Gives incoming profiles priority, then fills spare slots deterministically. */
function selectProfileIds(
  existingProfileRules: Record<string, string>,
  incomingProfileRules: Record<string, string>,
  profileLimit: number,
) {
  const incomingProfileIds = Object.keys(incomingProfileRules).sort();
  const availableExistingSlots = Math.max(0, profileLimit - incomingProfileIds.length);
  const existingCandidateIds = Object.keys(existingProfileRules)
    .filter(profileId => !incomingProfileRules[profileId])
    .sort();
  const selectedExistingIds = availableExistingSlots
    ? existingCandidateIds.slice(-availableExistingSlots)
    : [];
  return [...selectedExistingIds, ...incomingProfileIds].slice(-Math.max(1, profileLimit)).sort();
}
