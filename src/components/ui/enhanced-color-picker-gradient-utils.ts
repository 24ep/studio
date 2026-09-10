import {
  DEFAULT_GRADIENT_POSITION,
  DEFAULT_GRADIENT_STOPS,
  EXPANDED_GRADIENT_STOPS,
} from './enhanced-color-picker-presets';
import type { GradientStop, GradientType, GradientValue } from './enhanced-color-picker-types';
export { formatGradientCss } from './enhanced-color-picker-gradient-format';
export { parseGradientValue } from './enhanced-color-picker-gradient-parse';

export function getGradientStopKey(stop: GradientStop, index: number) {
  return `${stop.color}-${stop.position}-${index}`;
}

export function canRemoveGradientStopByCount(stopCount: number) {
  return stopCount > 2;
}

export function createDefaultGradient(stops: GradientStop[] = DEFAULT_GRADIENT_STOPS): GradientValue {
  return {
    stops: stops.map((stop) => ({ ...stop })),
    type: 'linear',
    angle: 135,
  };
}

export function updateGradientStop(
  gradient: GradientValue,
  index: number,
  stopPatch: Partial<GradientStop>,
  originalStop?: GradientStop
): GradientValue {
  const newStops = [...gradient.stops];
  const currentStop = originalStop || newStops[index];

  if (!currentStop) {
    return gradient;
  }

  const stopIndex = newStops.findIndex(
    (stop) => stop.color === currentStop.color && stop.position === currentStop.position
  );

  if (stopIndex === -1) {
    return gradient;
  }

  newStops[stopIndex] = { ...currentStop, ...stopPatch };
  newStops.sort((a, b) => a.position - b.position);

  return {
    ...gradient,
    stops: newStops,
  };
}

export function addGradientStop(
  gradient?: GradientValue,
  expandedStops: GradientStop[] = EXPANDED_GRADIENT_STOPS
): GradientValue {
  if (!gradient || !gradient.stops.length) {
    return createDefaultGradient(expandedStops);
  }

  const newStops = [...gradient.stops];
  const midPosition = Math.round((newStops[0].position + newStops[newStops.length - 1].position) / 2);
  newStops.push({ color: '#10B981', position: midPosition });
  newStops.sort((a, b) => a.position - b.position);

  return {
    ...gradient,
    stops: newStops,
  };
}

export function removeGradientStop(gradient: GradientValue, index: number): GradientValue {
  if (gradient.stops.length <= 2) {
    return gradient;
  }

  return {
    ...gradient,
    stops: gradient.stops.filter((_, stopIndex) => stopIndex !== index),
  };
}

export function setGradientType(gradient: GradientValue, type: GradientType): GradientValue {
  const supportsPosition = type === 'radial' || type === 'conic' || type === 'diamond';

  return {
    ...gradient,
    type,
    position: supportsPosition ? gradient.position || DEFAULT_GRADIENT_POSITION : undefined,
    size: type === 'radial' ? gradient.size || 50 : undefined,
  };
}

export function shouldShowGradientAngleControl(gradient: GradientValue) {
  return gradient.type === 'linear' || gradient.type === 'conic' || !gradient.type;
}

export function shouldShowGradientPositionControl(gradient: GradientValue) {
  return gradient.type === 'radial' || gradient.type === 'conic' || gradient.type === 'diamond';
}

export function getGradientAngleValue(gradient: GradientValue) {
  return gradient.angle || (gradient.type === 'conic' ? 0 : 135);
}

export function getGradientPositionValue(gradient: GradientValue) {
  return gradient.position || DEFAULT_GRADIENT_POSITION;
}

export function getGradientSizeValue(gradient: GradientValue) {
  return gradient.size || 50;
}
