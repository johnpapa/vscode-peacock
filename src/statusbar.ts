import { StatusBarAlignment, window, StatusBarItem } from 'vscode';
import { getShowColorInStatusBar, getPeacockColor } from './configuration';
import { State, Commands } from './models';

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
  const peacockColor = getPeacockColor();
  sb.text = `$(paintcan) ${peacockColor}`;
  sb.command = Commands.showAndCopyCurrentColor;
  sb.tooltip = 'Current Peacock Color';
  if (show) {
    sb.show();
  } else {
    clearStatusBar();
  }
}
