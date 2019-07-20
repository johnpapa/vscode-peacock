import {
  StatusBarAlignment,
  window,
  StatusBarItem
} from 'vscode';

let statusBarItem: StatusBarItem;

export function clearStatusBar() {
  createStatusBarItem();

  statusBarItem.text = '';
  statusBarItem.hide();
}

export function updateStatusBar(text: string) {
  createStatusBarItem();
  if( text) {
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
