export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generates a random delay between min and max milliseconds
 * @param min Minimum delay in milliseconds
 * @param max Maximum delay in milliseconds
 * @returns Promise that resolves after random delay
 *
 * @example
 * // Delay between 100-500ms
 * await randomDelay(100, 500);
 *
 * // Using with config
 * import { config } from '../config';
 * await randomDelay(config.marketplace.randomDelayMin, config.marketplace.randomDelayMax);
 */
export function randomDelay(min: number, max: number): Promise<void> {
  const randomMs = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, randomMs));
}
