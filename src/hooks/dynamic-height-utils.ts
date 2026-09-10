import type { MutableRefObject } from "react";

export interface UseDynamicHeightOptions {
  minHeight?: number;
  maxHeight?: number;
  buffer?: number;
  debounceMs?: number;
}

export interface ResolvedDynamicHeightOptions {
  minHeight: number;
  maxHeight: number;
  buffer: number;
  debounceMs: number;
}

interface DynamicHeightInput {
  windowHeight?: number | null;
  filterHeight: number;
  minHeight: number;
  maxHeight: number;
  buffer: number;
}

export function resolveDynamicHeightOptions(
  options: UseDynamicHeightOptions = {}
): ResolvedDynamicHeightOptions {
  return {
    minHeight: options.minHeight ?? 300,
    maxHeight: options.maxHeight ?? 800,
    buffer: options.buffer ?? 20,
    debounceMs: options.debounceMs ?? 150,
  };
}

export function sumElementHeights(elements: Iterable<HTMLElement>) {
  let totalHeight = 0;
  for (const element of elements) {
    totalHeight += element.offsetHeight;
  }
  return totalHeight;
}

export function calculateDynamicHeight({
  windowHeight,
  filterHeight,
  minHeight,
  maxHeight,
  buffer,
}: DynamicHeightInput) {
  const availableHeight = typeof windowHeight === "number"
    ? windowHeight - filterHeight - buffer
    : minHeight;
  return Math.max(minHeight, Math.min(maxHeight, availableHeight));
}

export function shouldCommitDynamicHeight(
  nextHeight: number,
  previousHeight: number,
  threshold = 5
) {
  return Math.abs(nextHeight - previousHeight) > threshold;
}

export function clearDynamicHeightTimer(
  timeoutRef: MutableRefObject<NodeJS.Timeout | null>
) {
  if (!timeoutRef.current) return;
  clearTimeout(timeoutRef.current);
  timeoutRef.current = null;
}
