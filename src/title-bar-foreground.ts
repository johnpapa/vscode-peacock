import { ForegroundColors } from './models';

export function getTitleBarForegroundForApp(
  appName: string | undefined,
  defaultForegroundHex: string,
) {
  return appName?.includes('Cursor')
    ? ForegroundColors.CursorTitleBarForeground
    : defaultForegroundHex;
}
