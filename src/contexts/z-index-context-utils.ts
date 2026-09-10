export type ZIndexLayerType = "modal" | "drawer" | "overlay" | "dropdown";

export interface ZIndexItem {
  id: string;
  type: ZIndexLayerType;
  zIndex: number;
  timestamp: number;
}

export const INITIAL_Z_INDEX = 1000;
export const Z_INDEX_INCREMENT = 100;

export function calculateZIndex(baseZIndex: number, multiplier = 1): number {
  return baseZIndex + Z_INDEX_INCREMENT * multiplier;
}

function getHighestZIndex(components: ZIndexItem[]): number | null {
  if (components.length === 0) {
    return null;
  }

  return Math.max(...components.map((component) => component.zIndex));
}

function getNextZIndex(type: ZIndexLayerType, components: ZIndexItem[]): number {
  const highestExisting = getHighestZIndex(components);

  if (type === "overlay") {
    const baseZIndex = highestExisting ?? INITIAL_Z_INDEX;
    const multiplier = highestExisting === null ? 5 : 3;
    return calculateZIndex(baseZIndex, multiplier);
  }

  if (highestExisting === null) {
    return INITIAL_Z_INDEX;
  }

  return calculateZIndex(highestExisting);
}

export function registerZIndexItem(
  components: ZIndexItem[],
  id: string,
  type: ZIndexLayerType,
  timestamp: number,
): ZIndexItem[] {
  const existing = components.find((component) => component.id === id);
  if (existing?.type === type) {
    return components;
  }

  const filtered = components.filter((component) => component.id !== id);
  const zIndex = Math.max(getNextZIndex(type, filtered), INITIAL_Z_INDEX);

  return [...filtered, { id, type, zIndex, timestamp }];
}

export function getLayerZIndex(components: ZIndexItem[], id: string): number {
  return components.find((component) => component.id === id)?.zIndex ?? INITIAL_Z_INDEX;
}

export function getLayerOverlayZIndex(components: ZIndexItem[], id: string): number {
  const component = components.find((item) => item.id === id);
  return component ? component.zIndex - 1 : INITIAL_Z_INDEX;
}
