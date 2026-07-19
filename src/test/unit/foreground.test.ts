import { describe, it, expect } from 'vitest';
import { selectForegroundColor } from '../../foreground-color';

describe('Foreground color', () => {
  const darkForeground = '#15202b';
  const lightForeground = '#e7e7e7';

  it('is set to light foreground on black backgrounds', () => {
    expect(selectForegroundColor(false, darkForeground, lightForeground)).toBe(lightForeground);
  });

  it('is set to light foreground on dark backgrounds', () => {
    expect(selectForegroundColor(false, darkForeground, lightForeground)).toBe(lightForeground);
  });

  it('is set to light foreground on less than 50% bright backgrounds', () => {
    expect(selectForegroundColor(false, darkForeground, lightForeground)).toBe(lightForeground);
  });

  it('is set to dark foreground on greater than or equal to 50% bright backgrounds', () => {
    expect(selectForegroundColor(true, darkForeground, lightForeground)).toBe(darkForeground);
  });

  it('is set to dark foreground on light backgrounds', () => {
    expect(selectForegroundColor(true, darkForeground, lightForeground)).toBe(darkForeground);
  });

  it('is set to dark foreground on white backgrounds', () => {
    expect(selectForegroundColor(true, darkForeground, lightForeground)).toBe(darkForeground);
  });
});
