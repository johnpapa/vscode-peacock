import * as tinycolor from 'tinycolor2';
import { getDarkForeground, getLightForeground } from './configuration';

export function getColorHex(color: string = '') {
  return tinycolor(color).toHexString();
}

export function getBackgroundColorHex(color: string = '') {
  return tinycolor(color).toHexString();
}

export function getForegroundColorHex(backgroundColor: string = '') {
  const background = tinycolor(backgroundColor);
  const foreground = background.isLight() ? getDarkForeground() : getLightForeground();
  return tinycolor(foreground).toHexString();
}

export function getInactiveForegroundColorHex(backgroundColor: string = '') {
  return tinycolor.mix(tinycolor(getForegroundColorHex(backgroundColor)), tinycolor(backgroundColor), 20);
}

export function getLightenedColorHex(color: string = '', amount: number = 10) {
  return tinycolor(color).lighten(amount).toHexString();
}

export function getDarkenedColorHex(color: string = '', amount: number = 10) {
  return tinycolor(color).darken(amount).toHexString();
}

export function getRandomColorHex() {
  return tinycolor.random().toHexString();
}

export function getColorBrightness(input: string = '') {
  return tinycolor(input).getBrightness();
}

export function formatHex(color: string = '') {
  return tinycolor(color).toHexString();
}

export function isValidColorInput(input: string) {
  return tinycolor(input).isValid();
}
