import * as tinycolor from 'tinycolor2';
import { ColorAdjustment, ForegroundColors } from './models';

export function getColorHex(color = '') {
  return formatHex(tinycolor(color));
}

export function getBackgroundColorHex(color = '') {
  return formatHex(tinycolor(color));
}

export function getInactiveBackgroundColorHex(backgroundColor = '') {
  const background = tinycolor(backgroundColor);
  return formatHex(tinycolor.mix(background, tinycolor('black'), 50));
}

export function getForegroundColorHex(backgroundColor = '') {
  const background = tinycolor(backgroundColor);
  const foreground = background.isLight()
    ? ForegroundColors.DarkForeground
    : ForegroundColors.LightForeground;
  return formatHex(tinycolor(foreground));
}

export function getInactiveForegroundColorHex(backgroundColor = '') {
  const foreground = tinycolor(getForegroundColorHex(backgroundColor));
  const background = tinycolor(backgroundColor);
  return formatHex(tinycolor.mix(foreground, background, 25));
}

export function getBadgeBackgroundColorHex(backgroundColor = '') {
  const background = tinycolor(backgroundColor);
  const complementHsl = background.toHsl();

  // Grayscale colors get their hue shifted deterministically based
  // on their lightness (mostly for fun so they aren't all red). All others
  // get a triad color scheme complement shifted 120 degrees.
  if (complementHsl.h === 0 && complementHsl.s === 0) {
    complementHsl.h = Math.round(360 * complementHsl.l);
  } else {
    complementHsl.h = (complementHsl.h + 120) % 360;
  }

  // Force the saturation and brightness to the middle for best contrast with all colors
  complementHsl.s = 0.5;
  complementHsl.l = 0.5;

  const badgeColor = tinycolor(complementHsl);
  return formatHex(badgeColor);
}

export function getBadgeForegroundColorHex(backgroundColor = '') {
  const background = tinycolor(getBadgeBackgroundColorHex(backgroundColor));
  return getForegroundColorHex(formatHex(background));
}

export function getAdjustedColorHex(color = '', adjustment: ColorAdjustment) {
  switch (adjustment) {
    case 'lighten':
      return getLightenedColorHex(color);

    case 'darken':
      return getDarkenedColorHex(color);

    default:
      return color;
  }
}

export function getLightenedColorHex(color = '', amount = 10) {
  return formatHex(tinycolor(color).lighten(amount));
}

export function getDarkenedColorHex(color: string, amount = 10) {
  return formatHex(tinycolor(color).darken(amount));
}

export function getRandomColorHex() {
  return formatHex(tinycolor.random());
}

export function getColorBrightness(input = '') {
  return tinycolor(input).getBrightness();
}

export function isValidColorInput(input: string) {
  return tinycolor(input).isValid();
}

function formatHex(color: tinycolorInstance) {
  return color.getAlpha() < 1 ? color.toHex8String() : color.toHexString();
}
