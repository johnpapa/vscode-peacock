import { StatusBarAlignment, window, StatusBarItem } from 'vscode';
import { getShowColorInStatusBar, getEnvironmentAwareColor } from './configuration';
import { Commands } from './models';
import { createCssProfileMarkerLabel, ICssProfile } from './css-injection/profiles';

const _statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
let cssProfile: ICssProfile | undefined;

export const getStatusBarItem = () => {
  updateStatusBar();
  return _statusBarItem;
};

export function clearStatusBar() {
  const sb = _statusBarItem;
  sb.text = '';
  sb.color = undefined;
  sb.accessibilityInformation = undefined;
  sb.hide();
}

export function setCssProfileStatusBar(profile: ICssProfile | undefined) {
  cssProfile = profile;
  updateStatusBar();
}

export function updateStatusBar() {
  const sb = _statusBarItem;
  const show = getShowColorInStatusBar();
  if (cssProfile) {
    const label = createCssProfileMarkerLabel(cssProfile);
    sb.text = show ? `$(paintcan) ${cssProfile.color}` : '';
    sb.color = show ? undefined : 'transparent';
    sb.command = Commands.showAndCopyCurrentColor;
    sb.tooltip = show ? 'Copy the Peacock color' : label;
    sb.accessibilityInformation = { label };
    sb.show();
    return;
  }

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
