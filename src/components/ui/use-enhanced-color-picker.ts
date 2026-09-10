"use client";

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import {
  EXPANDED_GRADIENT_STOPS,
  addGradientStop,
  createDefaultGradient,
  formatValue,
  getDisplayText,
  getPreviewStyle,
  isValidHex,
  normalizeHex,
  parseValue,
  removeGradientStop,
  setGradientType,
  updateGradientStop,
  type ColorMode,
  type ColorValue,
  type GradientStop,
  type GradientType,
  type GradientValue,
} from './enhanced-color-picker-utils';

const COLOR_PICKER_MODES: ColorMode[] = ['solid', 'gradient', 'texture', 'image', 'video'];

export function useEnhancedColorPickerController({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string | ColorValue;
}) {
  const [open, setOpen] = useState(false);
  const [colorValue, setColorValue] = useState<ColorValue>(() => parseValue(value));
  const [activeTab, setActiveTab] = useState<ColorMode>(colorValue.mode);
  const isInternalUpdateRef = useRef(false);

  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    const parsed = parseValue(value);
    setColorValue(parsed);

    if (COLOR_PICKER_MODES.includes(parsed.mode)) {
      setActiveTab(parsed.mode);
    }
  }, [value]);

  const handleColorValueChange = (newValue: ColorValue) => {
    setColorValue(newValue);
    isInternalUpdateRef.current = true;
    onChange(formatValue(newValue));
  };

  const handleGradientValueChange = (gradient: GradientValue) => {
    handleColorValueChange({ ...colorValue, mode: 'gradient', gradient });
  };

  const handleGradientPatch = (patch: Partial<GradientValue>) => {
    if (!colorValue.gradient) return;
    handleGradientValueChange({ ...colorValue.gradient, ...patch });
  };

  const handleSolidColorChange = (hex: string) => {
    const normalized = normalizeHex(hex);
    if (isValidHex(normalized)) {
      handleColorValueChange({ ...colorValue, mode: 'solid', solid: normalized });
    }
  };

  const handleGradientStopChange = (
    index: number,
    stop: Partial<GradientStop>,
    originalStop?: GradientStop
  ) => {
    if (!colorValue.gradient) {
      handleGradientValueChange(createDefaultGradient());
      return;
    }

    handleGradientValueChange(updateGradientStop(colorValue.gradient, index, stop, originalStop));
  };

  const handleAddGradientStop = () => {
    handleGradientValueChange(addGradientStop(colorValue.gradient, EXPANDED_GRADIENT_STOPS));
  };

  const handleRemoveGradientStop = (index: number) => {
    if (!colorValue.gradient || colorValue.gradient.stops.length <= 2) return;
    handleGradientValueChange(removeGradientStop(colorValue.gradient, index));
  };

  const handleGradientTypeChange = (type: GradientType) => {
    if (!colorValue.gradient) return;
    handleGradientValueChange(setGradientType(colorValue.gradient, type));
  };

  const handleGradientPositionChange = (x: number, y: number) => {
    handleGradientPatch({ position: { x, y } });
  };

  const handleTextureChange = (textureId: string) => {
    handleColorValueChange({ ...colorValue, mode: 'texture', texture: textureId });
  };

  const handleMediaUpload = (mode: 'image' | 'video', event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const dataUrl = readerEvent.target?.result;
      if (typeof dataUrl !== 'string') return;

      handleColorValueChange({
        ...colorValue,
        mode,
        image: mode === 'image' ? dataUrl : colorValue.image,
        video: mode === 'video' ? dataUrl : colorValue.video,
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePreviewKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.currentTarget.click();
  };

  return {
    activeTab,
    colorValue,
    displayText: getDisplayText(colorValue),
    handleAddGradientStop,
    handleColorValueChange,
    handleCreateGradient: () => handleGradientValueChange(createDefaultGradient()),
    handleGradientAngleChange: (angle: number) => handleGradientPatch({ angle }),
    handleGradientPositionChange,
    handleGradientSizeChange: (size: number) => handleGradientPatch({ size }),
    handleGradientStopChange,
    handleGradientTypeChange,
    handleMediaUpload,
    handlePreviewKeyDown,
    handleRemoveGradientStop,
    handleSolidColorChange,
    handleTextureChange,
    open,
    previewStyle: getPreviewStyle(colorValue),
    setActiveTab,
    setOpen,
  };
}
