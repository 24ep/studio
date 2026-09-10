import type { GradientStop, GradientValue } from "./enhanced-color-picker-types";
import { normalizeHex } from "./enhanced-color-picker-color-utils";

function parseGradientStops(stopsStr: string): GradientStop[] {
  const stopMatches = stopsStr.matchAll(/(#[0-9A-Fa-f]{6})\s+(\d+)%/g);
  const stops: GradientStop[] = [];

  for (const match of stopMatches) {
    stops.push({
      color: normalizeHex(match[1]),
      position: parseInt(match[2]),
    });
  }

  if (stops.length > 0) {
    return stops;
  }

  const colorMatches = stopsStr.match(/#[0-9A-Fa-f]{6}/g);

  if (!colorMatches) {
    return [];
  }

  return colorMatches.map((color, index) => ({
    color: normalizeHex(color),
    position: Math.round((index / (colorMatches.length - 1)) * 100),
  }));
}

function parseGradientPosition(positionStr: string): { x: number; y: number } {
  const atMatch = positionStr.match(/at\s+(\d+)%\s+(\d+)%/);

  if (atMatch) {
    return { x: parseInt(atMatch[1]), y: parseInt(atMatch[2]) };
  }

  return { x: 50, y: 50 };
}

export function parseGradientValue(value: string): GradientValue | null {
  const linearMatch = value.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);

  if (linearMatch) {
    const angle = parseInt(linearMatch[1]);
    const stops = parseGradientStops(linearMatch[2]);
    return stops.length >= 2 ? { stops, type: "linear", angle } : null;
  }

  const radialMatch = value.match(/radial-gradient\(([^,]+),\s*(.+)\)/);

  if (radialMatch) {
    const stops = parseGradientStops(radialMatch[2]);
    const position = parseGradientPosition(radialMatch[1]);
    return stops.length >= 2 ? { stops, type: "radial", position } : null;
  }

  const conicMatch = value.match(/conic-gradient\(([^,]+),\s*(.+)\)/);

  if (conicMatch) {
    const angleStr = conicMatch[1];
    const stops = parseGradientStops(conicMatch[2]);
    const angle = angleStr.includes("deg") ? parseInt(angleStr.match(/(\d+)deg/)?.[1] || "0") : 0;
    return stops.length >= 2 ? { stops, type: "conic", angle } : null;
  }

  const stops = parseGradientStops(value);
  return stops.length >= 2 ? { stops, type: "linear", angle: 135 } : null;
}
