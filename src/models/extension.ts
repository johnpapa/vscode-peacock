import * as vscode from 'vscode';
import { extensionId } from './constants';

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
