import * as vscode from 'vscode';
import { extensionId } from './constants';

export * from './constants';
export * from './enums';
export * from './favorites';
export * from './interfaces';
export * from './state';

export function getExtension() {
  let extension: vscode.Extension<any> | undefined;
  const ext = vscode.extensions.getExtension(extensionId);
  if (!ext) {
    throw new Error('Extension was not found.');
  }
  if (ext) {
    extension = ext;
  }
  return extension;
}
