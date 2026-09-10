"use client";

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  clampColorPickerPercent,
  getPresetColorButtonClassName,
  getSolidOpacity,
  getSolidOpacityLabel,
  PRESET_COLORS,
  type ColorValue,
} from './enhanced-color-picker-utils';

interface SolidColorPanelProps {
  colorValue: ColorValue;
  onColorValueChange: (value: ColorValue) => void;
  onSolidColorChange: (hex: string) => void;
}

export function SolidColorPanel({
  colorValue,
  onColorValueChange,
  onSolidColorChange,
}: SolidColorPanelProps) {
  const opacity = getSolidOpacity(colorValue);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-2 block">Preset Colors</Label>
        <div className="grid grid-cols-8 gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={getPresetColorButtonClassName(colorValue.solid === color)}
              style={{ backgroundColor: color }}
              onClick={() => onSolidColorChange(color)}
              title={color}
            />
          ))}
        </div>
      </div>
      <div>
        <Label className="text-sm font-medium mb-2 block">Custom Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={colorValue.solid || '#000000'}
            onChange={(event) => onSolidColorChange(event.target.value)}
            className="w-12 h-10 p-1"
          />
          <Input
            type="text"
            value={colorValue.solid || '#000000'}
            onChange={(event) => onSolidColorChange(event.target.value)}
            placeholder="#000000"
            className="flex-1 font-mono"
            maxLength={7}
          />
        </div>
      </div>
      <div>
        <Label className="text-sm font-medium mb-2 block">{getSolidOpacityLabel(opacity)}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(event) => {
              onColorValueChange({
                ...colorValue,
                mode: 'solid',
                solidOpacity: parseInt(event.target.value),
              });
            }}
            className="flex-1"
          />
          <Input
            type="number"
            min={0}
            max={100}
            value={opacity}
            onChange={(event) => {
              const nextOpacity = clampColorPickerPercent(event.target.value);
              onColorValueChange({ ...colorValue, mode: 'solid', solidOpacity: nextOpacity });
            }}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
}
