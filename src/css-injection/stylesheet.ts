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

export function parseStylesheet(content: string): IStylesheetParts {
  const start = content.indexOf(cssPatchStart);
  const end = content.indexOf(cssPatchEnd);

  if (start === -1 && end === -1) {
    return { before: content, after: '' };
  }

  if (
    start === -1 ||
    end === -1 ||
    start !== content.lastIndexOf(cssPatchStart) ||
    end !== content.lastIndexOf(cssPatchEnd) ||
    end < start
  ) {
    throw new CssPatchError(
      'The Peacock CSS override block is malformed or appears more than once. No changes were made.',
    );
  }

  const blockEnd = end + cssPatchEnd.length;
  return {
    before: content.slice(0, start),
    block: content.slice(start, blockEnd),
    after: content.slice(blockEnd),
  };
}

export function extractCssProfileRules(block: string | undefined) {
  const rules: Record<string, string> = {};
  if (!block) {
    return rules;
  }

  const profilePattern = new RegExp(
    `${escapeRegExp(cssProfileStartPrefix)}([a-f\\d]{16})__\\*/[\\s\\S]*?${escapeRegExp(
      cssProfileEndPrefix,
    )}\\1__\\*/`,
    'g',
  );
  let match: RegExpExecArray | null;
  while ((match = profilePattern.exec(block))) {
    const id = match[1];
    if (rules[id]) {
      throw new CssPatchError('A Peacock CSS profile is duplicated. No changes were made.');
    }
    rules[id] = match[0];
  }

  const profileCount = Object.keys(rules).length;
  const profileStarts = block.split(cssProfileStartPrefix).length - 1;
  const profileEnds = block.split(cssProfileEndPrefix).length - 1;
  if (profileStarts !== profileCount || profileEnds !== profileCount) {
    throw new CssPatchError('The Peacock CSS profile list is malformed. No changes were made.');
  }

  return rules;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  const block = `${cssPatchStart}${rules}${cssPatchEnd}`;
  const updatedContent = `${parts.before}${block}${parts.after}`;

  return {
    content: updatedContent,
    changed: updatedContent !== content,
  };
}

export function removeCssPatch(content: string): IStylesheetChange {
  const parts = parseStylesheet(content);
  if (!parts.block) {
    return { content, changed: false };
  }
  extractCssProfileRules(parts.block);

  return {
    content: `${parts.before}${parts.after}`,
    changed: true,
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
