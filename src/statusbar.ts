import { StatusBarAlignment, window, StatusBarItem, env } from 'vscode';
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
  // Peacock already colors statusBarItem.remoteBackground/remoteForeground
  // differently in a remote context, but that alone is easy to miss at a
  // glance (#392) -- the paintcan icon looks the same either way. A $(remote)
  // prefix makes "this window is remote" readable from the status bar text
  // itself, with no new color tokens or theme keys involved.
  const remotePrefix = env.remoteName ? '$(remote) ' : '';
  sb.text = `${remotePrefix}$(paintcan) ${color}`;
  sb.command = Commands.showAndCopyCurrentColor;
  sb.tooltip = env.remoteName
    ? `Copy the Peacock color (remote: ${env.remoteName})`
    : 'Copy the Peacock color';
  if (show && !!color) {
    sb.show();
  } else {
    clearStatusBar();
  }
}
