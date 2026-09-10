"use client";

import React from 'react';
import { ColorPicker } from '@/components/ui/color-picker';
import { cn } from '@/lib/utils';

interface PersonalColorPickerProps {
  className?: string;
  personalColor?: string;
  onColorChange?: (color: string) => void;
  isAdminMode?: boolean;
  disabled?: boolean;
}

export function PersonalColorPicker({ 
  className, 
  personalColor = '#3B82F6', 
  onColorChange, 
  isAdminMode = false,
  disabled = false
}: PersonalColorPickerProps) {
  const handleColorChange = (color: string) => {
    if (onColorChange && !disabled) {
      onColorChange(color);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2 text-primary">
        <ColorPicker
          value={personalColor}
          onChange={handleColorChange}
          className="w-full"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Click the color swatch to change
        </p>
      </div>
    </div>
  );
}
