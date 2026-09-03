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
  const statusBarItem = _statusBarItem;
  statusBarItem.text = '';
  statusBarItem.color = undefined;
  statusBarItem.accessibilityInformation = undefined;
  statusBarItem.hide();
}

/** Publishes the accessibility marker used to select this window's CSS profile. */
export function setCssProfileStatusBar(profile: ICssProfile | undefined) {
  cssProfile = profile;
  updateStatusBar();
}

export function updateStatusBar() {
  const statusBarItem = _statusBarItem;
  const showColorInStatusBar = getShowColorInStatusBar();
  if (cssProfile) {
    const profileMarkerLabel = createCssProfileMarkerLabel(cssProfile);
    statusBarItem.text = showColorInStatusBar ? `$(paintcan) ${cssProfile.color}` : '';
    statusBarItem.color = showColorInStatusBar ? undefined : 'transparent';
    statusBarItem.command = Commands.showAndCopyCurrentColor;
    statusBarItem.tooltip = showColorInStatusBar ? 'Copy the Peacock color' : profileMarkerLabel;
    statusBarItem.accessibilityInformation = { label: profileMarkerLabel };
    statusBarItem.show();
    return;
  }

  const color = getEnvironmentAwareColor();
  statusBarItem.text = `$(paintcan) ${color}`;
  statusBarItem.command = Commands.showAndCopyCurrentColor;
  statusBarItem.tooltip = 'Copy the Peacock color';
  if (showColorInStatusBar && !!color) {
    statusBarItem.show();
  } else {
    clearStatusBar();
  }
}
