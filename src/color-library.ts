import * as tinycolor from 'tinycolor2';
import { getDarkForeground, getLightForeground } from './configuration';

export function getColorHex(color: string = '') {
  return formatHex(tinycolor(color));
}

export function getBackgroundColorHex(color: string = '') {
  return formatHex(tinycolor(color));
}

export function getInactiveBackgroundColorHex(backgroundColor: string = '') {
  const background = tinycolor(backgroundColor);
  return formatHex(tinycolor.mix(background, tinycolor('black'), 50));
}

export function getForegroundColorHex(backgroundColor: string = '') {
  const background = tinycolor(backgroundColor);
  const foreground = background.isLight() ? getDarkForeground() : getLightForeground();
  return formatHex(tinycolor(foreground));
}

export function getInactiveForegroundColorHex(backgroundColor: string = '') {
  const foreground = tinycolor(getForegroundColorHex(backgroundColor));
  const background = tinycolor(backgroundColor);
  return formatHex(tinycolor.mix(foreground, background, 25));
}

export function getLightenedColorHex(color: string = '', amount: number = 10) {
  return formatHex(tinycolor(color).lighten(amount));
}

export function getDarkenedColorHex(color: string = '', amount: number = 10) {
  return formatHex(tinycolor(color).darken(amount));
}

export function getRandomColorHex() {
  return formatHex(tinycolor.random());
}

export function getColorBrightness(input: string = '') {
  return tinycolor(input).getBrightness();
}

export function isValidColorInput(input: string) {
  return tinycolor(input).isValid();
}

function formatHex(color: tinycolorInstance) {
  return color.getAlpha() < 1 ? color.toHex8String() : color.toHexString();
}