import { namedColors } from './named-colors';

export function isValidHexColor(input: string) {
  return /^#[0-9A-F]{6}$/i.test(input);
}

export function isValidNamedColor(input: string) {
  const knownNamedColors = Object.keys(namedColors);
  return knownNamedColors.indexOf(input.substr(1).toLowerCase()) > -1;
}
