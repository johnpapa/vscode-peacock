import * as vscode from 'vscode';
import { getExtension } from './';

export class State {
  private static _extContext: vscode.ExtensionContext;

  public static get extensionContext(): vscode.ExtensionContext {
    return this._extContext;
  }

  public static set extensionContext(ec: vscode.ExtensionContext) {
    this._extContext = ec;
  }
}

export function getExtensionVersion() {
  const extension = getExtension();
  const version: string = extension ? extension.packageJSON.version : '';
  return version;
}
