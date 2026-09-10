export const identity = (value: unknown) => value;

export function runWithFallback<T>(label: string, operation: () => T, fallback: T): T {
  try {
    return operation();
  } catch (error) {
    console.warn(`${label}:`, error);
    return fallback;
  }
}
