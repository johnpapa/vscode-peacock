import { execFileSync } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { ICssPatcher } from './css-patcher';
import { CssProfileRegistry } from './profiles';
import { installCssProfiles, removeCssPatch } from './stylesheet';

const stylesheetFilename = 'workbench.desktop.main.css';

export const cssPatcher: ICssPatcher = {
  /** Searches the known packaged and development layouts for each applicable app root. */
  async locate(cachedStylesheetPath?: string) {
    if (cachedStylesheetPath && (await this.validate(cachedStylesheetPath))) {
      return cachedStylesheetPath;
    }

    const applicationRoots = [vscode.env.appRoot, findWindowsAppRootFromWsl()].filter(
      (root): root is string => !!root,
    );
    const stylesheetCandidates = applicationRoots.reduce<string[]>((candidatePaths, root) => {
      candidatePaths.push(
        path.join(root, 'resources', 'app', 'out', 'vs', 'workbench', stylesheetFilename),
        path.join(root, 'out', 'vs', 'workbench', stylesheetFilename),
      );
      return candidatePaths;
    }, []);

    for (const stylesheetPath of stylesheetCandidates) {
      if (await this.validate(stylesheetPath)) {
        return stylesheetPath;
      }
    }
    return undefined;
  },

  async validate(stylesheetPath: string) {
    if (!path.isAbsolute(stylesheetPath) || path.basename(stylesheetPath) !== stylesheetFilename) {
      return false;
    }
    try {
      return (await fs.stat(stylesheetPath)).isFile();
    } catch {
      return false;
    }
  },

  async install(stylesheetPath: string, profileRegistry: CssProfileRegistry) {
    ensureStylesheetPath(stylesheetPath);
    const stylesheetContent = await fs.readFile(stylesheetPath, 'utf8');
    const stylesheetChange = installCssProfiles(stylesheetContent, profileRegistry);
    if (stylesheetChange.changed) {
      await writeAtomically(stylesheetPath, stylesheetChange.content);
    }
    return stylesheetChange.changed;
  },

  async remove(stylesheetPath: string) {
    ensureStylesheetPath(stylesheetPath);
    const stylesheetContent = await fs.readFile(stylesheetPath, 'utf8');
    const stylesheetChange = removeCssPatch(stylesheetContent);
    if (stylesheetChange.changed) {
      await writeAtomically(stylesheetPath, stylesheetChange.content);
    }
    return stylesheetChange.changed;
  },
};

function ensureStylesheetPath(stylesheetPath: string) {
  if (!path.isAbsolute(stylesheetPath) || path.basename(stylesheetPath) !== stylesheetFilename) {
    throw new Error(`Expected ${stylesheetFilename}, received ${stylesheetPath}`);
  }
}

/** Preserves file permissions and avoids leaving a partially written stylesheet. */
async function writeAtomically(stylesheetPath: string, stylesheetContent: string) {
  const stylesheetStat = await fs.stat(stylesheetPath);
  const temporaryPath = `${stylesheetPath}.peacock-${process.pid}-${Date.now()}.tmp`;
  try {
    await fs.writeFile(temporaryPath, stylesheetContent, {
      encoding: 'utf8',
      mode: stylesheetStat.mode,
    });
    await fs.rename(temporaryPath, stylesheetPath);
  } catch (error) {
    await fs.unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

/** Finds the Windows-side VS Code installation when this extension runs in WSL. */
function findWindowsAppRootFromWsl() {
  if (vscode.env.remoteName !== 'wsl') {
    return undefined;
  }

  try {
    const windowsCodeCommandPath = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-Command', '(Get-Command code).Source'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    if (!windowsCodeCommandPath) {
      return undefined;
    }
    const windowsApplicationRoot = path.win32.dirname(path.win32.dirname(windowsCodeCommandPath));
    return execFileSync('wslpath', ['-u', windowsApplicationRoot], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}
