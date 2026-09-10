"use client";

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  PRESET_TEXTURES,
  getPreviewStyle,
  getTexturePreviewStyle,
  getTextureTileClassName,
  type ColorValue,
  type GradientStop,
  type GradientType,
} from './enhanced-color-picker-utils';
import {
  GradientGeometryControls,
  GradientStopsEditor,
  GradientTypeSelector,
} from './enhanced-color-picker-gradient-controls';

export { MediaUploadPanel } from './enhanced-color-picker-media-panel';
export { SolidColorPanel } from './enhanced-color-picker-solid-panel';

interface GradientPanelProps {
  colorValue: ColorValue;
  onAddGradientStop: () => void;
  onCreateGradient: () => void;
  onGradientAngleChange: (angle: number) => void;
  onGradientPositionChange: (x: number, y: number) => void;
  onGradientSizeChange: (size: number) => void;
  onGradientStopChange: (index: number, stop: Partial<GradientStop>, originalStop?: GradientStop) => void;
  onGradientTypeChange: (type: GradientType) => void;
  onRemoveGradientStop: (index: number) => void;
}

interface TexturePanelProps {
  colorValue: ColorValue;
  onTextureChange: (textureId: string) => void;
}

export function GradientPanel({
  colorValue,
  onAddGradientStop,
  onCreateGradient,
  onGradientAngleChange,
  onGradientPositionChange,
  onGradientSizeChange,
  onGradientStopChange,
  onGradientTypeChange,
  onRemoveGradientStop,
}: GradientPanelProps) {
  const gradient = colorValue.gradient;

  if (!gradient || gradient.stops.length === 0) {
    return (
      <div className="text-center py-4">
        <Button type="button" variant="outline" onClick={onCreateGradient}>
          Create Gradient
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GradientTypeSelector gradient={gradient} onGradientTypeChange={onGradientTypeChange} />
      <GradientStopsEditor
        gradient={gradient}
        onAddGradientStop={onAddGradientStop}
        onGradientStopChange={onGradientStopChange}
        onRemoveGradientStop={onRemoveGradientStop}
      />
      <GradientGeometryControls
        gradient={gradient}
        onGradientAngleChange={onGradientAngleChange}
        onGradientPositionChange={onGradientPositionChange}
        onGradientSizeChange={onGradientSizeChange}
      />
      <div className="w-full h-20 rounded border" style={getPreviewStyle({ ...colorValue, mode: 'gradient' })} />
    </div>
  );
}

export function TexturePanel({ colorValue, onTextureChange }: TexturePanelProps) {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium mb-2 block">Texture Patterns</Label>
      <div className="grid grid-cols-2 gap-3">
        {PRESET_TEXTURES.map((texture) => (
          <button
            key={texture.id}
            type="button"
            className={getTextureTileClassName(colorValue.texture === texture.id)}
            style={getTexturePreviewStyle(texture.pattern)}
            onClick={() => onTextureChange(texture.id)}
          >
            <span className="text-xs text-muted-foreground">{texture.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
