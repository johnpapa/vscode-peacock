import * as tinycolor from 'tinycolor2';
import { ColorAdjustment, ForegroundColors, ReadabilityRatios } from './models';

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

export function getReadableAccentColorHex(
  backgroundColor = '',
  ratio: ReadabilityRatios = ReadabilityRatios.Text
) {
  const background = tinycolor(backgroundColor);
  const foreground = background.triad()[1];

  const shadeCount = 16;
  const shadeValue = 1 / shadeCount;
  const { h, s } = foreground.toHsl();

  const shadesWithRatios = [...Array(shadeCount + 1).keys()].map(index => {
    const shade = tinycolor({ h, s, l: index * shadeValue });
    return {
      contrast: tinycolor.readability(shade, background),
      hex: formatHex(shade)
    };
  });

  shadesWithRatios.sort((shade1, shade2) => shade1.contrast - shade2.contrast);
  const firstReadableShade = shadesWithRatios.find(shade => {
    return shade.contrast >= ratio;
  });

  return firstReadableShade ? firstReadableShade.hex : '#ffffff';
}

export function getBadgeBackgroundColorHex(backgroundColor = '') {
  return getReadableAccentColorHex(
    backgroundColor,
    ReadabilityRatios.UserInterface
  );
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

export function getReadabilityRatio(
  backgroundColor = '',
  foregroundColor = ''
) {
  return tinycolor.readability(
    tinycolor(backgroundColor),
    tinycolor(foregroundColor)
  );
}

export function isValidColorInput(input: string) {
  return tinycolor(input).isValid();
}

function formatHex(color: tinycolor.Instance) {
  return color.getAlpha() < 1 ? color.toHex8String() : color.toHexString();
}
