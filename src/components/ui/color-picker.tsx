import React from 'react';
import { EnhancedColorPicker } from './enhanced-color-picker';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
  allowBackground?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

// Backward compatible wrapper around EnhancedColorPicker
export function ColorPicker({ value, onChange, className, allowBackground, placeholder, disabled }: ColorPickerProps) {
  return (
    <EnhancedColorPicker
      value={value}
      onChange={onChange}
      className={className}
      allowBackground={allowBackground}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
