import { Commands, PeacockColor, State } from './models';
import * as path from 'path';
import { getFavoriteColors } from './configuration';
import {
  Command,
  Event,
  EventEmitter,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  window,
  workspace,
} from 'vscode';

let _colorTreeDataProvider: DepColorProvider;

export function refreshColorsView(): void {
  getColorTreeDataProvider().refresh();
}

export function getColorTreeDataProvider(): DepColorProvider {
  if (!_colorTreeDataProvider) {
    _colorTreeDataProvider = createTreeDataProvider();
  }
  return _colorTreeDataProvider;
}

function createTreeDataProvider(): DepColorProvider {
  const tree = new DepColorProvider(workspace.rootPath as string);
  window.createTreeView('peacock.colors', {
    treeDataProvider: tree,
    showCollapseAll: true,
    canSelectMany: false,
  });

  return tree;
}

export class DepColorProvider implements TreeDataProvider<ColorNode> {
  private _onDidChangeTreeData: EventEmitter<ColorNode | undefined | void> = new EventEmitter<
    ColorNode | undefined | void
  >();
  readonly onDidChangeTreeData: Event<ColorNode | undefined | void> = this._onDidChangeTreeData
    .event;

  constructor(private workspaceRoot: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ColorNode): TreeItem {
    return element;
  }

  getChildren(element?: ColorNode): Thenable<ColorNode[]> {
    if (!this.workspaceRoot) {
      window.showInformationMessage('No dependency in empty workspace');
      return Promise.resolve([]);
    }

    if (element) {
      return Promise.resolve([]);
    } else {
      return Promise.resolve(this.getColors());
    }
  }

  private getColors(): ColorNode[] {
    const toColorDep = ({ name, value: color }: PeacockColor): ColorNode => {
      const cmd = {
        command: Commands.enterColor,
        arguments: [color],
      } as Command;
      const colorNode = new ColorNode(name, color, TreeItemCollapsibleState.None, cmd);
      return colorNode;
    };

    const { values: favorites } = getFavoriteColors();

    return favorites.map(c => toColorDep(c));
  }
}

export class ColorNode extends TreeItem {
  constructor(
    public readonly label: string,
    private readonly color: string,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly command?: Command,
  ) {
    super('$(globe) ${label}', collapsibleState);

    this.tooltip = `${this.label} ${this.color}`;
    this.description = this.color;

    // this.iconPath = State.extensionContext.asAbsolutePath(
    //   path.join('resources', 'colors', 'angular-color.svg'),
    // );
  }

  contextValue = this.color; // TODO: do i need this?
}
