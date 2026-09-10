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
  // Opens the Custom Color Picker pre-filled with the color above --
  // enterColorHandler() with no argument already seeds the picker from
  // getEnvironmentAwareColor(), so clicking the status bar is a shortcut
  // straight into editing the color that's already showing here, rather
  // than only copying it to the clipboard (that copy/notify behavior is
  // unchanged and still available via "Peacock: Copy the Current Color to
  // the Clipboard" in the Command Palette).
  sb.command = Commands.enterColor;
  sb.tooltip = env.remoteName
    ? `Choose a Custom Color (remote: ${env.remoteName})`
    : 'Choose a Custom Color';
  if (show && !!color) {
    sb.show();
  } else {
    clearStatusBar();
  }
}
