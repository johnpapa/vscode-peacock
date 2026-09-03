import * as vscode from 'vscode';

import { getBackgroundColorHex, isValidColorInput } from '../color-library';
import { IPeacockWorkspaces } from '../models';

export type WorkspaceIdentityKind = 'workspaceFile' | 'workspaceFolder';

export interface IWorkspaceIdentity {
  kind: WorkspaceIdentityKind;
  address: string;
  key: string;
}

export type ResolvedWorkspaceColorSource =
  | 'transient'
  | 'private'
  | 'workspaceMap'
  | 'legacy'
  | 'none';

export interface IWorkspaceMapMatch {
  color?: string;
  name?: string;
  ambiguousNames: string[];
  invalidNames: string[];
}

export interface IResolvedWorkspaceColor {
  color?: string;
  source: ResolvedWorkspaceColorSource;
  workspaceName?: string;
  ambiguousNames: string[];
  invalidNames: string[];
}

interface IResolveWorkspaceColorOptions {
  identity?: IWorkspaceIdentity;
  workspaces?: IPeacockWorkspaces;
  transientColor?: string;
  privateColor?: string;
  legacyColor?: string;
}

interface IWorkspaceFolderLike {
  uri: vscode.Uri;
}

export function getCurrentWorkspaceIdentity(): IWorkspaceIdentity | undefined {
  return createWorkspaceIdentity(vscode.workspace.workspaceFile, vscode.workspace.workspaceFolders);
}

export function createWorkspaceIdentity(
  workspaceFile: vscode.Uri | undefined,
  workspaceFolders: readonly IWorkspaceFolderLike[] | undefined,
): IWorkspaceIdentity | undefined {
  if (workspaceFile && workspaceFile.scheme.toLowerCase() !== 'untitled') {
    const address = canonicalizeWorkspaceUri(workspaceFile);
    if (address) {
      return {
        kind: 'workspaceFile',
        address,
        key: `workspaceFile:${address}`,
      };
    }
  }

  if (workspaceFolders?.length === 1) {
    const address = canonicalizeWorkspaceUri(workspaceFolders[0].uri);
    if (address) {
      return {
        kind: 'workspaceFolder',
        address,
        key: `workspaceFolder:${address}`,
      };
    }
  }

  return undefined;
}

export function canonicalizeWorkspaceAddress(value: string): string | undefined {
  const input = value.trim();
  if (!input) {
    return undefined;
  }

  if (isAbsoluteFilePath(input)) {
    return canonicalizeFilePath(input);
  }

  if (!/^[a-z][a-z\d+.-]*:/i.test(input)) {
    return undefined;
  }

  try {
    return canonicalizeWorkspaceUri(vscode.Uri.parse(input, true));
  } catch {
    return undefined;
  }
}

export function canonicalizeWorkspaceUri(uri: vscode.Uri): string | undefined {
  const scheme = uri.scheme.toLowerCase();
  if (!scheme || scheme === 'untitled') {
    return undefined;
  }

  if (scheme === 'file') {
    return canonicalizeFilePath(uri.fsPath);
  }

  if (scheme === 'vscode-remote' && !uri.authority) {
    return undefined;
  }

  const authority = uri.authority.toLowerCase();
  const normalizedPath = normalizeSlashPath(uri.path, true);
  const query = uri.query ? `?${uri.query}` : '';
  const fragment = uri.fragment ? `#${uri.fragment}` : '';
  return `${scheme}://${authority}${normalizedPath}${query}${fragment}`;
}

export function matchWorkspaceColor(
  identity: IWorkspaceIdentity | undefined,
  workspaces: IPeacockWorkspaces = {},
): IWorkspaceMapMatch {
  const invalidNames: string[] = [];
  if (!identity) {
    return { ambiguousNames: [], invalidNames };
  }

  const matches: Array<{ name: string; color: string }> = [];
  Object.keys(workspaces).forEach(name => {
    const definition = workspaces[name];
    if (
      !definition ||
      !Array.isArray(definition.path) ||
      definition.path.length === 0 ||
      !definition.color ||
      !isValidColorInput(definition.color)
    ) {
      invalidNames.push(name);
      return;
    }

    const addresses = definition.path
      .map(canonicalizeWorkspaceAddress)
      .filter((address): address is string => !!address);
    if (addresses.length !== definition.path.length) {
      invalidNames.push(name);
      return;
    }

    if (addresses.includes(identity.address)) {
      matches.push({ name, color: getBackgroundColorHex(definition.color) });
    }
  });

  if (matches.length !== 1) {
    return {
      ambiguousNames: matches.length > 1 ? matches.map(match => match.name) : [],
      invalidNames,
    };
  }

  return {
    color: matches[0].color,
    name: matches[0].name,
    ambiguousNames: [],
    invalidNames,
  };
}

export function resolveWorkspaceColor({
  identity,
  workspaces = {},
  transientColor,
  privateColor,
  legacyColor,
}: IResolveWorkspaceColorOptions): IResolvedWorkspaceColor {
  const transient = normalizeColor(transientColor);
  if (transient) {
    return emptyResolution('transient', transient);
  }

  const privateWorkspaceColor = normalizeColor(privateColor);
  if (privateWorkspaceColor) {
    return emptyResolution('private', privateWorkspaceColor);
  }

  const workspaceMatch = matchWorkspaceColor(identity, workspaces);
  if (workspaceMatch.color) {
    return {
      color: workspaceMatch.color,
      source: 'workspaceMap',
      workspaceName: workspaceMatch.name,
      ambiguousNames: workspaceMatch.ambiguousNames,
      invalidNames: workspaceMatch.invalidNames,
    };
  }

  const legacy = normalizeColor(legacyColor);
  return {
    color: legacy,
    source: legacy ? 'legacy' : 'none',
    ambiguousNames: workspaceMatch.ambiguousNames,
    invalidNames: workspaceMatch.invalidNames,
  };
}

function emptyResolution(
  source: Exclude<ResolvedWorkspaceColorSource, 'workspaceMap' | 'none'>,
  color: string,
): IResolvedWorkspaceColor {
  return { color, source, ambiguousNames: [], invalidNames: [] };
}

function normalizeColor(color: string | undefined) {
  return color && isValidColorInput(color) ? getBackgroundColorHex(color) : undefined;
}

function canonicalizeFilePath(value: string) {
  const normalized = normalizeSlashPath(value, value.startsWith('/') || value.startsWith('\\'));
  const isWindows = /^[a-z]:\//i.test(normalized) || normalized.startsWith('//');
  return `file:${isWindows ? normalized.toLowerCase() : normalized}`;
}

function isAbsoluteFilePath(value: string) {
  return value.startsWith('/') || /^[a-z]:[\\/]/i.test(value) || /^\\\\[^\\]/.test(value);
}

function normalizeSlashPath(value: string, absolute: boolean) {
  const withSlashes = value.replace(/\\/g, '/');
  const isUnc = withSlashes.startsWith('//');
  const drive = withSlashes.match(/^[a-z]:/i)?.[0] || '';
  const parts = withSlashes
    .slice(isUnc ? 2 : drive.length)
    .split('/')
    .filter(part => !!part && part !== '.');
  const normalizedParts: string[] = [];
  parts.forEach(part => {
    if (part === '..') {
      normalizedParts.pop();
    } else {
      normalizedParts.push(part);
    }
  });

  if (isUnc) {
    return `//${normalizedParts.join('/')}`;
  }
  if (drive) {
    return `${drive}/${normalizedParts.join('/')}`.replace(/\/$/, '');
  }
  const prefix = absolute ? '/' : '';
  const normalized = `${prefix}${normalizedParts.join('/')}`;
  return normalized.length > 1 ? normalized.replace(/\/$/, '') : normalized;
}
