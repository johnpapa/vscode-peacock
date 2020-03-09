import { StatusBarAlignment, window, StatusBarItem } from 'vscode';
import { getShowColorInStatusBar, getEnvironmentAwareColor } from './configuration';
import { Commands } from './models';

const _statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);

export const getStatusBarItem = () => {
  updateStatusBar();
  return _statusBarItem;
};

export function clearStatusBar() {
  const sb = _statusBarItem;
  sb.text = '';
  sb.hide();
}

export function updateStatusBar() {
  const sb = _statusBarItem;
  const show = getShowColorInStatusBar();
  const color = getEnvironmentAwareColor();
  sb.text = `$(paintcan) ${color}`;
  sb.command = Commands.showAndCopyCurrentColor;
  sb.tooltip = 'Copy the Peacock color';
  if (show && !!color) {
    sb.show();
  } else {
    clearStatusBar();
  }
}
