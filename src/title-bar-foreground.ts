// Must stay a plain require() (not `import * as tinycolor`) so tinycolor stays callable
// under both the webpack/classic-interop build and the Vitest/esbuild ESM build (PR #672).
// eslint-disable-next-line @typescript-eslint/no-require-imports
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
