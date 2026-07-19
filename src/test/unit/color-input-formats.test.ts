import { describe, it, expect } from 'vitest';
import tinycolor from 'tinycolor2';

type InputCase = { input: string; expected: string };

const validCases: InputCase[] = [
  { input: '#000', expected: '#000000' },
  { input: '000', expected: '#000000' },
  { input: '#369C', expected: '#336699cc' },
  { input: '369C', expected: '#336699cc' },
  { input: '#f0f0f6', expected: '#f0f0f6' },
  { input: 'f0f0f6', expected: '#f0f0f6' },
  { input: '#f0f0f688', expected: '#f0f0f688' },
  { input: 'f0f0f688', expected: '#f0f0f688' },
  { input: 'blanchedalmond', expected: '#ffebcd' },
  { input: 'DarkBlue', expected: '#00008b' },
  { input: 'rgb(255 0 0)', expected: '#ff0000' },
  { input: 'rgb 255 0 0', expected: '#ff0000' },
  { input: 'rgba(255, 0, 0, .5)', expected: '#ff000080' },
  { input: 'rgb(100% 255 0)', expected: '#ffff00' },
  { input: 'hsl(0 100% 50%)', expected: '#ff0000' },
  { input: 'hsl 0 100% 50%', expected: '#ff0000' },
  { input: 'hsla(0, 100%, 50%, .5)', expected: '#ff000080' },
  { input: 'hsl(0, 100%, .5)', expected: '#ff0000' },
  { input: 'hsv(0, 100%, 100%)', expected: '#ff0000' },
  { input: 'hsv 0 100% 100%', expected: '#ff0000' },
  { input: 'hsva(0, 100%, 100%, .5)', expected: '#ff000080' },
  { input: 'hsv(0, 1, 100%)', expected: '#ff0000' },
];

const invalidCases = ['', '   ', 'not-a-color', '###', '#zzzzzz', 'rgb(foo, 0, 0)'];

describe('Color input format normalization', () => {
  validCases.forEach(({ input, expected }) => {
    it(`normalizes "${input}"`, () => {
      const parsed = tinycolor(input);
      expect(parsed.isValid()).toBe(true);
      expect(parsed.toHex8String()).toBe(expected.length === 7 ? `${expected}ff` : expected);
    });
  });

  invalidCases.forEach(input => {
    it(`rejects invalid input "${input}"`, () => {
      expect(tinycolor(input).isValid()).toBe(false);
    });
  });
});
