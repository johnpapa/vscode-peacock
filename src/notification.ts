import * as vscode from 'vscode';
import { Logger } from './logging';

export const notify = (message: string, log = false) => {
  vscode.window.showInformationMessage(message);
  if (log) {
    Logger.info(message);
  }
};
