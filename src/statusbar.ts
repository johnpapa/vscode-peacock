import { StatusBarAlignment, window, StatusBarItem } from 'vscode';
import { getShowColorInStatusBar } from './configuration';
import { State } from './models';

const _statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);

export const getStatusBarItem = () => {
  updateStatusBar();
  return _statusBarItem;
};

export function clearStatusBar() {
  const sb = _statusBarItem;
  // sb.text = '';
  sb.hide();
}

export function updateStatusBar() {
  const sb = _statusBarItem;
  const show = getShowColorInStatusBar();
  sb.text = `$(paintcan) ${State.recentColor}`;
  if (show) {
    sb.show();
  } else {
    clearStatusBar();
  }
}
