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

export function getBackgroundHoverColorHex(backgroundColor = '') {
  const background = tinycolor(backgroundColor);
  const hoverColor = background.isLight()
    ? background.darken()
    : background.lighten();
  return formatHex(hoverColor);
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
  ratio = ReadabilityRatios.Text
) {
  const background = tinycolor(backgroundColor);

  // Get an initial color for the badge as the first in a triad (120 degrees)
  // from the background color since it will be a more pleasing shade than
  // pure complementary (180 degrees).
  const foreground = background.triad()[1];

  // Convert the color to HSL to work with the channels individually
  let { h, s, l } = foreground.toHsl();

  // When there is no saturation we have some kind of grayscale color,
  // which for accent purposes should be colorized artificially
  if (s === 0) {

    // Spin the hue in the case of no saturation (grayscale). The spin is
    // deterministic based on the lightness of the color (0 to 1) and will
    // be mapped to one of the 6 primary and secondary hues (60 degree steps).
    h = 60 * Math.round(l * 6);
  }

  // Increase the saturation to 50% for any color that is very desaturated
  // to provide more of an accent in the manner that themes normally would
  if (s < 0.15) {
    s = 0.5;
  }

  // Create an array of 16 shades of the accent color from no luminance
  // (black) to full luminance (white) and determine the contrast ratio
  // of each against the background.
  const shadeCount = 16;
  const shadeValue = 1 / shadeCount;
  const shadesWithRatios = [...Array(shadeCount).keys()].map(index => {
    const shade = tinycolor({ h, s, l: index * shadeValue });
    return {
      contrast: tinycolor.readability(shade, background),
      hex: formatHex(shade)
    };
  });

  // Sort the shades by their contrast ratio from least to greatest so that
  // we can find the first shade that meets the readability threshold, but has
  // the least contrast of those that do.
  shadesWithRatios.sort((shade1, shade2) => shade1.contrast - shade2.contrast);
  const firstReadableShade = shadesWithRatios.find(shade => {
    return shade.contrast >= ratio;
  });

  // Return the first readable shade that meets
  // the threshold or white if none of them do
  return firstReadableShade ? firstReadableShade.hex : '#ffffff';
}

export function getBadgeBackgroundColorHex(backgroundColor = '') {
  return getReadableAccentColorHex(
    backgroundColor,
    ReadabilityRatios.UserInterfaceLow
  );
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
