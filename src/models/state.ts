import * as vscode from 'vscode';
import { Logger } from '../logging';
import { extensionShortName } from './constants';
import { getExtension } from '.';

export class State {
  /**
   * Recent Color is the most recently used color.
   * If you want the original Peacock color,
   * then use getPeacockColorMemento() in mementos.ts
   *
   * e.g.
   * Peacock may be using #fff and Peacock Remote is using #000.
   * When using remote, recent color may represent
   * the remote color #000 while the memento will always be the original #fff
   *
   *  */

  private static _recentColor = '';
  public static get recentColor(): string {
    return this._recentColor;
  }

  public static set recentColor(v: string) {
    this._recentColor = v;
    const msg = `${extensionShortName}: Saving the most recently used color ${this._recentColor} to state`;
    Logger.info(msg);
  }

  private static _extContext: vscode.ExtensionContext;

  public static get extensionContext(): vscode.ExtensionContext {
    return this._extContext;
  }

  public static set extensionContext(ec: vscode.ExtensionContext) {
    this._extContext = ec;
  }

  public static get extensionVersion(): string {
    let extension = getExtension();
    let version = extension ? extension.packageJSON.version : '';
    return version;
  }
}
