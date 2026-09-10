export function isArrayLikeObject<T>(value: unknown): value is ArrayLike<T> {
  return value !== null
    && typeof value === "object"
    && "length" in value
    && typeof (value as { length?: unknown }).length === "number";
}

function getConstructorName(value: unknown) {
  return value !== null && typeof value === "object"
    ? value.constructor?.name
    : undefined;
}

function getObjectKeys(value: unknown) {
  return value !== null && typeof value === "object" ? Object.keys(value) : null;
}

function getObjectSample(value: unknown) {
  if (value === null || typeof value !== "object") return null;
  try {
    return `${JSON.stringify(value).substring(0, 200)}...`;
  } catch {
    return "[Unserializable object]";
  }
}

export function debugFilterError(array: unknown, context: string): void {
  const debugInfo = {
    context,
    arrayType: typeof array,
    isArray: Array.isArray(array),
    isNull: array === null,
    isUndefined: array === undefined,
    constructor: getConstructorName(array),
    length: isArrayLikeObject(array) ? array.length : undefined,
    keys: getObjectKeys(array),
    sample: getObjectSample(array),
    timestamp: new Date().toISOString(),
  };
  console.warn("Filter error debug info:", debugInfo);
}
