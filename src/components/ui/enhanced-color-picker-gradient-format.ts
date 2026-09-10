import { DEFAULT_GRADIENT_POSITION } from "./enhanced-color-picker-presets";
import type { GradientStop, GradientValue } from "./enhanced-color-picker-types";
import { hexToRgba } from "./enhanced-color-picker-color-utils";

function formatGradientStop(stop: GradientStop): string {
  const stopOpacity = stop.opacity !== undefined ? stop.opacity : 100;
  const color = stopOpacity < 100 ? hexToRgba(stop.color, stopOpacity) : stop.color;

  return `${color} ${stop.position}%`;
}

export function formatGradientCss(gradient?: GradientValue): string | null {
  if (!gradient || !gradient.stops.length) {
    return null;
  }

  const gradientType = gradient.type || "linear";
  const stops = [...gradient.stops]
    .sort((a, b) => a.position - b.position)
    .map(formatGradientStop)
    .join(", ");

  switch (gradientType) {
    case "linear":
      return `linear-gradient(${gradient.angle || 135}deg, ${stops})`;
    case "radial": {
      const position = gradient.position || DEFAULT_GRADIENT_POSITION;
      const size = gradient.size || 50;
      return `radial-gradient(circle ${size}% at ${position.x}% ${position.y}%, ${stops})`;
    }
    case "conic": {
      const position = gradient.position || DEFAULT_GRADIENT_POSITION;
      return `conic-gradient(from ${gradient.angle || 0}deg at ${position.x}% ${position.y}%, ${stops})`;
    }
    case "diamond": {
      const position = gradient.position || DEFAULT_GRADIENT_POSITION;
      return `radial-gradient(ellipse 100% 100% at ${position.x}% ${position.y}%, ${stops})`;
    }
    default:
      return `linear-gradient(${gradient.angle || 135}deg, ${stops})`;
  }
}
