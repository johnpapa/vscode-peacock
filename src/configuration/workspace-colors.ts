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

/**
 * Returns the one stable address Peacock can use for the current window.
 * Saved multi-root workspaces use their workspace file; a window with one
 * folder uses that folder. Untitled multi-root workspaces have no stable key.
 */
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

/**
 * Converts a user-supplied absolute path or URI to Peacock's exact-match form.
 * This is lexical normalization only: it never resolves symlinks or touches the
 * filesystem.
 */
export function canonicalizeWorkspaceAddress(workspaceAddress: string): string | undefined {
  const trimmedAddress = workspaceAddress.trim();
  if (!trimmedAddress) {
    return undefined;
  }

  if (isAbsoluteFilePath(trimmedAddress)) {
    return canonicalizeFilePath(trimmedAddress);
  }

  if (!/^[a-z][a-z\d+.-]*:/i.test(trimmedAddress)) {
    return undefined;
  }

  try {
    return canonicalizeWorkspaceUri(vscode.Uri.parse(trimmedAddress, true));
  } catch {
    return undefined;
  }
}

/** Normalizes a VS Code URI without discarding remote authorities. */
export function canonicalizeWorkspaceUri(uri: vscode.Uri): string | undefined {
  const normalizedScheme = uri.scheme.toLowerCase();
  if (!normalizedScheme || normalizedScheme === 'untitled') {
    return undefined;
  }

  if (normalizedScheme === 'file') {
    return canonicalizeFilePath(uri.fsPath);
  }

  if (normalizedScheme === 'vscode-remote' && !uri.authority) {
    return undefined;
  }

  const normalizedAuthority = uri.authority.toLowerCase();
  const normalizedPath = normalizeSlashPath(uri.path, true);
  const query = uri.query ? `?${uri.query}` : '';
  const fragment = uri.fragment ? `#${uri.fragment}` : '';
  return `${normalizedScheme}://${normalizedAuthority}${normalizedPath}${query}${fragment}`;
}

/**
 * Finds a single valid mapping whose normalized alias exactly equals the
 * workspace address. Multiple matches are deliberately treated as ambiguous.
 */
export function matchWorkspaceColor(
  identity: IWorkspaceIdentity | undefined,
  workspaceDefinitions: IPeacockWorkspaces = {},
): IWorkspaceMapMatch {
  const invalidNames: string[] = [];
  if (!identity) {
    return { ambiguousNames: [], invalidNames };
  }

  const matchingDefinitions: Array<{ name: string; color: string }> = [];
  Object.keys(workspaceDefinitions).forEach(workspaceName => {
    const definition = workspaceDefinitions[workspaceName];
    if (
      !definition ||
      !Array.isArray(definition.path) ||
      definition.path.length === 0 ||
      !definition.color ||
      !isValidColorInput(definition.color)
    ) {
      invalidNames.push(workspaceName);
      return;
    }

    const normalizedAliases = definition.path
      .map(canonicalizeWorkspaceAddress)
      .filter((address): address is string => !!address);
    if (normalizedAliases.length !== definition.path.length) {
      invalidNames.push(workspaceName);
      return;
    }

    if (normalizedAliases.includes(identity.address)) {
      matchingDefinitions.push({
        name: workspaceName,
        color: getBackgroundColorHex(definition.color),
      });
    }
  });

  if (matchingDefinitions.length !== 1) {
    return {
      ambiguousNames:
        matchingDefinitions.length > 1 ? matchingDefinitions.map(match => match.name) : [],
      invalidNames,
    };
  }

  return {
    color: matchingDefinitions[0].color,
    name: matchingDefinitions[0].name,
    ambiguousNames: [],
    invalidNames,
  };
}

/**
 * Resolves temporary session, private command, workspace mapping, and legacy
 * colors in that order while carrying mapping diagnostics forward.
 */
export function resolveWorkspaceColor({
  identity,
  workspaces = {},
  transientColor,
  privateColor,
  legacyColor,
}: IResolveWorkspaceColorOptions): IResolvedWorkspaceColor {
  const transientSessionColor = normalizeColor(transientColor);
  if (transientSessionColor) {
    return createDirectColorResolution('transient', transientSessionColor);
  }

  const privateWorkspaceColor = normalizeColor(privateColor);
  if (privateWorkspaceColor) {
    return createDirectColorResolution('private', privateWorkspaceColor);
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

  const legacyWorkspaceColor = normalizeColor(legacyColor);
  return {
    color: legacyWorkspaceColor,
    source: legacyWorkspaceColor ? 'legacy' : 'none',
    ambiguousNames: workspaceMatch.ambiguousNames,
    invalidNames: workspaceMatch.invalidNames,
  };
}

function createDirectColorResolution(
  source: Exclude<ResolvedWorkspaceColorSource, 'workspaceMap' | 'none'>,
  color: string,
): IResolvedWorkspaceColor {
  return { color, source, ambiguousNames: [], invalidNames: [] };
}

function normalizeColor(color: string | undefined) {
  return color && isValidColorInput(color) ? getBackgroundColorHex(color) : undefined;
}

function canonicalizeFilePath(filePath: string) {
  const normalizedPath = normalizeSlashPath(
    filePath,
    filePath.startsWith('/') || filePath.startsWith('\\'),
  );
  const isWindowsPath = /^[a-z]:\//i.test(normalizedPath) || normalizedPath.startsWith('//');
  return `file:${isWindowsPath ? normalizedPath.toLowerCase() : normalizedPath}`;
}

function isAbsoluteFilePath(filePath: string) {
  return filePath.startsWith('/') || /^[a-z]:[\\/]/i.test(filePath) || /^\\\\[^\\]/.test(filePath);
}

/**
 * Collapses slash and dot-segment differences while preserving Unix roots,
 * Windows drive prefixes, and Windows network paths beginning with `//`.
 */
function normalizeSlashPath(pathValue: string, isAbsolutePath: boolean) {
  const slashNormalizedPath = pathValue.replace(/\\/g, '/');
  const isWindowsNetworkPath = slashNormalizedPath.startsWith('//');
  const windowsDrivePrefix = slashNormalizedPath.match(/^[a-z]:/i)?.[0] || '';
  const pathSegments = slashNormalizedPath
    .slice(isWindowsNetworkPath ? 2 : windowsDrivePrefix.length)
    .split('/')
    .filter(pathSegment => !!pathSegment && pathSegment !== '.');
  const normalizedSegments: string[] = [];
  pathSegments.forEach(pathSegment => {
    if (pathSegment === '..') {
      normalizedSegments.pop();
    } else {
      normalizedSegments.push(pathSegment);
    }
  });

  if (isWindowsNetworkPath) {
    return `//${normalizedSegments.join('/')}`;
  }
  if (windowsDrivePrefix) {
    return `${windowsDrivePrefix}/${normalizedSegments.join('/')}`.replace(/\/$/, '');
  }
  const rootPrefix = isAbsolutePath ? '/' : '';
  const normalizedPath = `${rootPrefix}${normalizedSegments.join('/')}`;
  return normalizedPath.length > 1 ? normalizedPath.replace(/\/$/, '') : normalizedPath;
}
