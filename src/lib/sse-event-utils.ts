const NON_COUNTED_SSE_TYPES = new Set(['keepalive', 'connected']);

export type SseJsonParseResult =
  | { ok: true; data: unknown }
  | { ok: false; rawData: unknown };

export function parseSseJsonData(rawData: unknown): SseJsonParseResult {
  if (typeof rawData !== 'string') {
    return { ok: false, rawData };
  }

  try {
    return { ok: true, data: JSON.parse(rawData) as unknown };
  } catch {
    return { ok: false, rawData };
  }
}

export function getSsePayloadType(data: unknown) {
  if (!data || typeof data !== 'object') {
    return undefined;
  }

  const type = (data as { type?: unknown }).type;
  return typeof type === 'string' ? type : undefined;
}

export function isMeaningfulSsePayload(data: unknown) {
  const type = getSsePayloadType(data);
  return typeof type === 'string' && !NON_COUNTED_SSE_TYPES.has(type);
}
