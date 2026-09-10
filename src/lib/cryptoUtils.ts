import crypto from 'crypto';

/**
 * Generate a cryptographically secure random string
 * @param length - Length of the random string (default: 16)
 * @returns A secure random string
 */
export function generateSecureRandomString(length: number = 16): string {
  const bytes = crypto.randomBytes(length);
  return bytes.toString('base64url').slice(0, length);
}

/**
 * Generate a secure random filename-safe string
 * Uses base64url encoding which is URL and filename safe
 * @param length - Length of the random string (default: 12)
 * @returns A secure random string safe for filenames
 */
export function generateSecureFilename(length: number = 12): string {
  const bytes = crypto.randomBytes(Math.ceil(length * 3 / 4));
  return bytes.toString('base64url').slice(0, length);
}

/**
 * Generate a secure random number between min and max (inclusive)
 * @param min - Minimum value (default: 0)
 * @param max - Maximum value (default: 1)
 * @returns A secure random number
 */
export function generateSecureRandomNumber(min: number = 0, max: number = 1): number {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValid = Math.floor(256 ** bytesNeeded / range) * range - 1;
  
  let randomValue: number;
  do {
    const randomBytes = crypto.randomBytes(bytesNeeded);
    randomValue = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      randomValue = randomValue * 256 + randomBytes[i];
    }
  } while (randomValue > maxValid);
  
  return min + (randomValue % range);
}

