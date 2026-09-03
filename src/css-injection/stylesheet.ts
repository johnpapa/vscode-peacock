import {
  cssProfileEndPrefix,
  cssProfileLimit,
  cssProfileStartPrefix,
  CssProfileRegistry,
  generateCssProfileRule,
} from './profiles';

export const cssPatchStart = '/*__PEACOCK_CSS_OVERRIDE_START__*/';
export const cssPatchEnd = '/*__PEACOCK_CSS_OVERRIDE_END__*/';
export const cssPatchVersion = 1;

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
  profileIds: string[];
}

export function parseStylesheet(content: string): IStylesheetParts {
  const starts = findAll(content, cssPatchStart);
  const ends = findAll(content, cssPatchEnd);

  if (!starts.length && !ends.length) {
    return { before: content, after: '' };
  }

  if (starts.length !== 1 || ends.length !== 1 || ends[0] < starts[0]) {
    throw new CssPatchError(
      'The Peacock CSS override block is malformed or appears more than once. No changes were made.',
    );
  }

  const blockEnd = ends[0] + cssPatchEnd.length;
  return {
    before: content.slice(0, starts[0]),
    block: content.slice(starts[0], blockEnd),
    after: content.slice(blockEnd),
  };
}

export function extractCssProfileRules(block: string | undefined) {
  const rules: Record<string, string> = {};
  if (!block) {
    return rules;
  }

  let cursor = block.indexOf(cssPatchStart) + cssPatchStart.length;
  const blockEnd = block.indexOf(cssPatchEnd, cursor);
  while (cursor < blockEnd) {
    const start = block.indexOf(cssProfileStartPrefix, cursor);
    if (start === -1 || start >= blockEnd) {
      break;
    }

    const idStart = start + cssProfileStartPrefix.length;
    const idEnd = block.indexOf('__*/', idStart);
    if (idEnd === -1 || idEnd >= blockEnd) {
      throw new CssPatchError(
        'A Peacock CSS profile start marker is malformed. No changes were made.',
      );
    }

    const id = block.slice(idStart, idEnd);
    if (!/^[a-f\d]{16}$/.test(id) || rules[id]) {
      throw new CssPatchError(
        'A Peacock CSS profile identifier is invalid or duplicated. No changes were made.',
      );
    }

    const endMarker = `${cssProfileEndPrefix}${id}__*/`;
    const end = block.indexOf(endMarker, idEnd + 4);
    if (end === -1 || end >= blockEnd) {
      throw new CssPatchError(
        `Peacock CSS profile ${id} has no matching end marker. No changes were made.`,
      );
    }

    const ruleEnd = end + endMarker.length;
    rules[id] = block.slice(start, ruleEnd);
    cursor = ruleEnd;
  }

  const profileStarts = findAll(block, cssProfileStartPrefix).length;
  const profileEnds = findAll(block, cssProfileEndPrefix).length;
  if (profileStarts !== Object.keys(rules).length || profileEnds !== Object.keys(rules).length) {
    throw new CssPatchError('The Peacock CSS profile list is malformed. No changes were made.');
  }

  return rules;
}

export function installCssProfiles(
  content: string,
  registry: CssProfileRegistry,
  limit = cssProfileLimit,
): IStylesheetChange {
  const parts = parseStylesheet(content);
  const existingRules = extractCssProfileRules(parts.block);
  const incomingRules = Object.values(registry).reduce<Record<string, string>>((rules, profile) => {
    rules[profile.id] = generateCssProfileRule(profile);
    return rules;
  }, {});
  const profileIds = selectProfileIds(existingRules, incomingRules, limit);
  const rules = profileIds.map(id => incomingRules[id] || existingRules[id]).join('');
  const block = `${cssPatchStart}/*${cssPatchVersion}*/${rules}${cssPatchEnd}`;
  const updatedContent = `${parts.before}${block}${parts.after}`;

  return {
    content: updatedContent,
    changed: updatedContent !== content,
    profileIds,
  };
}

export function removeCssPatch(content: string): IStylesheetChange {
  const parts = parseStylesheet(content);
  if (!parts.block) {
    return { content, changed: false, profileIds: [] };
  }
  extractCssProfileRules(parts.block);

  return {
    content: `${parts.before}${parts.after}`,
    changed: true,
    profileIds: [],
  };
}

function selectProfileIds(
  existingRules: Record<string, string>,
  incomingRules: Record<string, string>,
  limit: number,
) {
  const incomingIds = Object.keys(incomingRules).sort();
  const remaining = Math.max(0, limit - incomingIds.length);
  const candidates = Object.keys(existingRules)
    .filter(id => !incomingRules[id])
    .sort();
  const existingIds = remaining ? candidates.slice(-remaining) : [];
  return [...existingIds, ...incomingIds].slice(-Math.max(1, limit)).sort();
}

function findAll(content: string, token: string) {
  const indexes: number[] = [];
  let cursor = 0;
  while (cursor < content.length) {
    const index = content.indexOf(token, cursor);
    if (index === -1) {
      break;
    }
    indexes.push(index);
    cursor = index + token.length;
  }
  return indexes;
}
