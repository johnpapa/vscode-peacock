import * as vscode from 'vscode';
import { Commands, PeacockColor, starterSetOfFavorites } from './models';
import * as fs from 'fs';
import * as path from 'path';

export class DepColorProvider implements vscode.TreeDataProvider<ColorNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    ColorNode | undefined | void
  > = new vscode.EventEmitter<ColorNode | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<ColorNode | undefined | void> = this
    ._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ColorNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ColorNode): Thenable<ColorNode[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace');
      return Promise.resolve([]);
    }

    if (element) {
      return Promise.resolve([]);
    } else {
      return Promise.resolve(this.getColors());
    }
  }

  private getColors(): ColorNode[] {
    const toColorDep = ({ name, value }: PeacockColor): ColorNode => {
      return new ColorNode(name, value, vscode.TreeItemCollapsibleState.None, {
        command: Commands.changeColorToRandom,
      } as vscode.Command);
    };

    return starterSetOfFavorites.map(c => toColorDep(c));
  }
}

export class ColorNode extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private readonly color: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
  ) {
    super('$(globe) ${label}', collapsibleState);

    this.tooltip = `${this.label} ${this.color}`;
    this.description = this.color;

    this.iconPath = {
      light: path.join(__filename, '..', '..', '..', '..', 'resources', 'light', 'pencil.svg'),
      dark: path.join(__filename, '..', '..', '..', '..', 'resources', 'dark', 'pencil.svg'),
    };
  }

  // iconPath = {
  //   // light: '../resources/light/refresh.svg',
  //   // dark: '../resources/dark/refresh.svg',
  //   light: path.join(__filename, '..', '..', 'resources', 'light', 'pencil.svg'),
  //   dark: path.join(__filename, '..', '..', 'resources', 'dark', 'pencil.svg'),
  // };

  contextValue = 'pcontext';
}

export class DepNodeProvider implements vscode.TreeDataProvider<NodeDependency> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    NodeDependency | undefined | void
  > = new vscode.EventEmitter<NodeDependency | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<NodeDependency | undefined | void> = this
    ._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: NodeDependency): vscode.TreeItem {
    return element;
  }

  getChildren(element?: NodeDependency): Thenable<NodeDependency[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace');
      return Promise.resolve([]);
    }

    if (element) {
      return Promise.resolve(
        this.getDepsInPackageJson(
          path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json'),
        ),
      );
    } else {
      const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
      if (this.pathExists(packageJsonPath)) {
        return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
      } else {
        vscode.window.showInformationMessage('Workspace has no package.json');
        return Promise.resolve([]);
      }
    }
  }

  /**
   * Given the path to package.json, read all its dependencies and devDependencies.
   */
  private getDepsInPackageJson(packageJsonPath: string): NodeDependency[] {
    if (this.pathExists(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      const toDep = (moduleName: string, version: string): NodeDependency => {
        if (this.pathExists(path.join(this.workspaceRoot, 'node_modules', moduleName))) {
          return new NodeDependency(moduleName, version, vscode.TreeItemCollapsibleState.Collapsed);
        } else {
          return new NodeDependency(moduleName, version, vscode.TreeItemCollapsibleState.None, {
            command: 'extension.openPackageOnNpm',
            title: '',
            arguments: [moduleName],
          });
        }
      };

      const deps = packageJson.dependencies
        ? Object.keys(packageJson.dependencies).map(dep =>
            toDep(dep, packageJson.dependencies[dep]),
          )
        : [];
      const devDeps = packageJson.devDependencies
        ? Object.keys(packageJson.devDependencies).map(dep =>
            toDep(dep, packageJson.devDependencies[dep]),
          )
        : [];
      return deps.concat(devDeps);
    } else {
      return [];
    }
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
    } catch (err) {
      return false;
    }

    return true;
  }
}

export class NodeDependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private readonly version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
  ) {
    super(label, collapsibleState);

    this.tooltip = `${this.label}-${this.version}`;
    this.description = this.version;
  }

  // iconPath = {
  //   light: vscode.Uri.file(path.join(__filename, '..', '..', 'resources', 'light', 'refresh.svg')),
  //   dark: vscode.Uri.file(path.join(__filename, '..', '..', 'resources', 'dark', 'refresh.svg')),
  // };

  contextValue = 'dependency';
}
