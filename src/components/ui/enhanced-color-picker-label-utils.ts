export function getColorPickerSelectionClassName(isSelected: boolean) {
  return isSelected
    ? 'border-primary ring-2 ring-primary ring-offset-2'
    : 'border-border';
}

export function getPresetColorButtonClassName(isSelected: boolean) {
  return `w-8 h-8 rounded border-2 transition-colors hover:scale-110 ${getColorPickerSelectionClassName(isSelected)}`;
}

export function getTextureTileClassName(isSelected: boolean) {
  return `h-20 rounded border-2 transition-all hover:scale-105 ${getColorPickerSelectionClassName(isSelected)}`;
}

export function getSolidOpacityLabel(opacity: number) {
  return `Opacity: ${opacity}%`;
}

export function getGradientAngleLabel(angle: number) {
  return `Angle: ${angle} deg`;
}

export function getGradientPositionAxisLabel(axis: 'X' | 'Y', value: number) {
  return `${axis}: ${value}%`;
}

export function getGradientSizeLabel(size: number) {
  return `Size: ${size}%`;
}
