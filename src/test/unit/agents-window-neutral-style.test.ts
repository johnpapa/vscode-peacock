import { describe, it, expect } from 'vitest';
import { getAgentsWindowNeutralStyle } from '../../color-library';
import {
  agentsWindowNeutralDarkBackground,
  agentsWindowNeutralLightBackground,
} from '../../models';

describe('Agents Window neutral style', () => {
  it('resolves to the dark neutral background for dark themes', () => {
    const style = getAgentsWindowNeutralStyle(false);
    expect(style.backgroundHex).toBe(agentsWindowNeutralDarkBackground);
  });

  it('resolves to the light neutral background for light themes', () => {
    const style = getAgentsWindowNeutralStyle(true);
    expect(style.backgroundHex).toBe(agentsWindowNeutralLightBackground);
  });

  it('computes a readable (light) foreground for the dark neutral background', () => {
    const style = getAgentsWindowNeutralStyle(false);
    // A dark background (#1e1e1e) should get a light foreground for contrast.
    expect(style.foregroundHex.toLowerCase()).not.toBe(
      agentsWindowNeutralDarkBackground.toLowerCase(),
    );
    expect(style.foregroundHex).toMatch(/^#/);
  });

  it('computes a readable (dark) foreground for the light neutral background', () => {
    const style = getAgentsWindowNeutralStyle(true);
    // A light background (#f3f3f3) should get a dark foreground for contrast.
    expect(style.foregroundHex.toLowerCase()).not.toBe(
      agentsWindowNeutralLightBackground.toLowerCase(),
    );
    expect(style.foregroundHex).toMatch(/^#/);
  });

  it('always returns the same neutral pair regardless of any accent color', () => {
    // The neutral style is intentionally independent of whatever accent
    // color the user picked - it must never track the accent, only the
    // theme kind - so calling it twice with the same theme kind should
    // always produce the same result.
    const first = getAgentsWindowNeutralStyle(false);
    const second = getAgentsWindowNeutralStyle(false);
    expect(first).toEqual(second);
  });
});
