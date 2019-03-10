import * as vscode from 'vscode';
import { Sections } from '../../models';

export function getExtension() {
  let extension: vscode.Extension<any> | undefined;
  const ext = vscode.extensions.getExtension('johnpapa.vscode-peacock');
  if (!ext) {
    throw new Error('Extension was not found.');
  }
  if (ext) {
    extension = ext;
  }
  return extension;
}
