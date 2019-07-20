import { StatusBarAlignment, window, StatusBarItem } from 'vscode';
import { getShowColorInStatusBar } from './configuration';

let statusBarItem: StatusBarItem;

export function clearStatusBar() {
  createStatusBarItem();

  statusBarItem.text = '';
  statusBarItem.hide();
}

export function updateStatusBar(text: string) {
  const show = getShowColorInStatusBar();
  if (show && text) {
    createStatusBarItem();
    statusBarItem.text = `$(paintcan) ${text}`;
    statusBarItem.show();
  } else {
    clearStatusBar();
  }
}

function createStatusBarItem() {
  if (!statusBarItem) {
    statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
  }
}
