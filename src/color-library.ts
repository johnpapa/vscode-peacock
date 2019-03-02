import { getDarkForeground, getLightForeground } from './configuration';
import { namedColors } from './models';

export function invertColor(hex: string) {
  // credit: https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
  if (hex.indexOf('#') === 0) {
    hex = hex.slice(1);
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6) {
    throw new Error(`Invalid HEX color ${hex}`);
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  const useDark = r * 0.299 + g * 0.587 + b * 0.114 > 186;

  let foreground = useDark ? getDarkForeground() : getLightForeground();

  // credit: http://stackoverflow.com/a/3943023/112731
  return foreground;
}

export function formatHex(input: string = '') {
  return input.substr(0, 1) === '#' ? input : `#${input}`;
}

export function generateRandomHexColor() {
  // credit: https://www.paulirish.com/2009/random-hex-color-code-snippets/
  const hex = (
    '000000' + Math.floor(Math.random() * 16777215).toString(16)
  ).slice(-6);
  return '#' + hex;
}

export function convertNameToHex(name: string) {
  return namedColors[name];
}

export function isValidHexColor(input: string) {
  return /^#[0-9A-F]{6}$/i.test(input) || /^#[0-9A-F]{3}$/i.test(input);
}

export function isValidNamedColor(input: string) {
  const knownNamedColors = Object.keys(namedColors);
  return knownNamedColors.indexOf(input.toLowerCase()) > -1;
}
