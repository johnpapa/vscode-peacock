export function selectForegroundColor(
  isLightBackground: boolean,
  darkForegroundColor: string,
  lightForegroundColor: string,
) {
  return isLightBackground ? darkForegroundColor : lightForegroundColor;
}
