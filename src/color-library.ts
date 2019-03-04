import * as tinycolor from 'tinycolor2';
import { getDarkForeground, getLightForeground } from './configuration';
import { ColorAdjustment } from './models';

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
    ? getDarkForeground()
    : getLightForeground();
  return formatHex(tinycolor(foreground));
}

export function getInactiveForegroundColorHex(backgroundColor = '') {
  const foreground = tinycolor(getForegroundColorHex(backgroundColor));
  const background = tinycolor(backgroundColor);
  return formatHex(tinycolor.mix(foreground, background, 25));
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
