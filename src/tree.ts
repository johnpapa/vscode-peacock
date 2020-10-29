import * as vscode from 'vscode';
import { Commands, PeacockColor, starterSetOfFavorites } from './models';
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

  // private async getCommand(): Promise<vscode.Command> {
  //   const cmds = await vscode.commands.getCommands(true);
  //   const cmd = cmds.find(c => c === Commands.changeColorToRandom);
  //   return { command: cmd + '' } as vscode.Command;
  // }

  private getColors(): ColorNode[] {
    const toColorDep = ({ name, value }: PeacockColor): ColorNode => {
      const cmd = {
        command: Commands.changeColorToRandom,
      } as vscode.Command;
      // const cmd = await this.getCommand();
      const colorNode = new ColorNode(name, value, vscode.TreeItemCollapsibleState.None, cmd);
      return colorNode;
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
