import * as tinycolor from 'tinycolor2';
import { getDarkForeground, getLightForeground } from './configuration';

export function getColorHex(input: string = '') {
  return tinycolor(input).toHexString();
}

export function getBackgroundColorHex(input: string = '') {
  return tinycolor(input).toHexString();
}

export function getForegroundColorHex(input: string = '') {
  const background = tinycolor(input);
  const foreground = background.isLight() ? getDarkForeground() : getLightForeground();
  return tinycolor(foreground).toHexString();
}

export function getInactiveForegroundColorHex(input: string = '') {
  return tinycolor.mix(tinycolor(getForegroundColorHex(input)), tinycolor(input), 20);
}

export function getLightenedColorHex(input: string = '', amount: number = 10) {
  return tinycolor(input).lighten(amount).toHexString();
}

export function getDarkenedColorHex(input: string = '', amount: number = 10) {
  return tinycolor(input).lighten(amount).toHexString();
}

export function getRandomColorHex() {
  return tinycolor.random().toHexString();
}

export function formatHex(input: string = '') {
  return tinycolor(input).toHexString();
}

export function isValidColorInput(input: string) {
  return tinycolor(input).isValid();
}
