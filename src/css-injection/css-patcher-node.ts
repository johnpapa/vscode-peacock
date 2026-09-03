import { execFileSync } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { ICssPatcher } from './css-patcher';
import { CssProfileRegistry } from './profiles';
import { installCssProfiles, removeCssPatch } from './stylesheet';

const stylesheetFilename = 'workbench.desktop.main.css';

export const cssPatcher: ICssPatcher = {
  async locate(cachedPath?: string) {
    if (cachedPath && (await this.validate(cachedPath))) {
      return cachedPath;
    }

    const roots = [vscode.env.appRoot, findWindowsAppRootFromWsl()].filter(
      (root): root is string => !!root,
    );
    const candidates = roots.reduce<string[]>((all, root) => {
      all.push(
        path.join(root, 'resources', 'app', 'out', 'vs', 'workbench', stylesheetFilename),
        path.join(root, 'out', 'vs', 'workbench', stylesheetFilename),
      );
      return all;
    }, []);

    for (const candidate of candidates) {
      if (await this.validate(candidate)) {
        return candidate;
      }
    }
    return undefined;
  },

  async validate(cssPath: string) {
    if (!path.isAbsolute(cssPath) || path.basename(cssPath) !== stylesheetFilename) {
      return false;
    }
    try {
      return (await fs.stat(cssPath)).isFile();
    } catch {
      return false;
    }
  },

  async install(cssPath: string, registry: CssProfileRegistry) {
    ensureStylesheetPath(cssPath);
    const content = await fs.readFile(cssPath, 'utf8');
    const change = installCssProfiles(content, registry);
    if (change.changed) {
      await writeAtomically(cssPath, change.content);
    }
    return change.changed;
  },

  async remove(cssPath: string) {
    ensureStylesheetPath(cssPath);
    const content = await fs.readFile(cssPath, 'utf8');
    const change = removeCssPatch(content);
    if (change.changed) {
      await writeAtomically(cssPath, change.content);
    }
    return change.changed;
  },
};

function ensureStylesheetPath(cssPath: string) {
  if (!path.isAbsolute(cssPath) || path.basename(cssPath) !== stylesheetFilename) {
    throw new Error(`Expected ${stylesheetFilename}, received ${cssPath}`);
  }
}

async function writeAtomically(cssPath: string, content: string) {
  const stat = await fs.stat(cssPath);
  const temporaryPath = `${cssPath}.peacock-${process.pid}-${Date.now()}.tmp`;
  try {
    await fs.writeFile(temporaryPath, content, { encoding: 'utf8', mode: stat.mode });
    await fs.rename(temporaryPath, cssPath);
  } catch (error) {
    try {
      await fs.unlink(temporaryPath);
    } catch {
      // The temporary file may not have been created.
    }
    throw error;
  }
}

function findWindowsAppRootFromWsl() {
  if (vscode.env.remoteName !== 'wsl') {
    return undefined;
  }

  try {
    const codeCommand = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-Command', '(Get-Command code).Source'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    if (!codeCommand) {
      return undefined;
    }
    const windowsRoot = path.win32.dirname(path.win32.dirname(codeCommand));
    return execFileSync('wslpath', ['-u', windowsRoot], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}
