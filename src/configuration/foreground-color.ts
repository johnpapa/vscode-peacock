import { ForegroundColors, StandardSettings } from '../models/enums';
import { readConfiguration } from './utils';

export function getDarkForegroundColorOrOverride() {
  return getDarkForegroundColor() || ForegroundColors.DarkForeground;
}

export function getLightForegroundColorOrOverride() {
  return getLightForegroundColor() || ForegroundColors.LightForeground;
}

export function getDarkForegroundColor() {
  return readConfiguration<string>(StandardSettings.DarkForegroundColor, '');
}

export function getLightForegroundColor() {
  return readConfiguration<string>(StandardSettings.LightForegroundColor, '');
}
