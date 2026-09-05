import tinycolor = require('tinycolor2');
import { ForegroundColors } from './models';

export function getTitleBarForegroundForApp(
  appName: string | undefined,
  backgroundHex: string,
  defaultForegroundHex: string,
) {
  const isCursor = !!appName && appName.includes('Cursor');
  const isLightBackground = tinycolor(backgroundHex).isLight();
  return isCursor && isLightBackground
    ? ForegroundColors.CursorTitleBarForeground
    : defaultForegroundHex;
}
