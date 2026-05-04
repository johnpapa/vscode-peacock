/**
 * Converts a string to a numeric hash value using FNV-1a algorithm
 * Provides better distribution for similar strings like file paths
 * @param str Input string to hash
 * @returns Numeric hash value
 */
const stringToHash = (str: string): number => {
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0); // Convert to 32-bit unsigned
};

/**
 * Generates a random number between 0 and 1 using a numeric seed
 * Based on Mulberry32 algorithm
 * @param seed Numeric seed value or string to hash
 * @returns Number between 0 and 1
 */
export const seededRandom = (seed: number | string): number => {
  let t = typeof seed === 'string' ? stringToHash(seed) : seed;
  t += 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/**
 * Gets the number of decimal places in a number
 * @param num Number to check
 * @returns Number of decimal places
 */
const getDecimalPlaces = (num: number): number => {
  const match = num.toString().match(/(?:\.(\d+))?$/);
  if (!match?.[1]) return 0;
  return match[1].length;
};

/**
 * Generates a deterministic random number within a range using a string seed
 * @param seed String value used as seed
 * @param max Maximum value (inclusive)
 * @param min Minimum value (inclusive), defaults to 0
 * @returns Random number between min and max (order doesn't matter)
 *          Returns integer if inputs are integers
 *          Returns decimal if any input is decimal, matching input precision
 */
export const seededRandomNumber = (seed: string, max: number, min: number = 0): number => {
  const actualMin = Math.min(min, max);
  const actualMax = Math.max(min, max);
  
  if (actualMin === actualMax) {
    return actualMin;
  }

  const decimals = Math.max(getDecimalPlaces(actualMin), getDecimalPlaces(actualMax));
  const random = seededRandom(seed);
  
  if (decimals === 0) {
    return Math.floor(random * (actualMax - actualMin + 1)) + actualMin;
  }
  
  const multiplier = Math.pow(10, decimals);
  const randomValue = random * (actualMax - actualMin) + actualMin;
  return Math.round(randomValue * multiplier) / multiplier;
};

/**
 * Generates a deterministic random integer within a range using a string seed
 * @param seed String value used as seed
 * @param max Maximum integer value (inclusive)
 * @param min Minimum integer value (inclusive), defaults to 0
 * @returns Random integer between min and max (order doesn't matter)
 */
export const seededRandomInt = (seed: string, max: number, min: number = 0): number => {
  const roundedMin = Math.round(min);
  const roundedMax = Math.round(max);
  return Math.round(seededRandomNumber(seed, roundedMax, roundedMin));
};