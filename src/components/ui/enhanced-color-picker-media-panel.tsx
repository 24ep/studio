"use client";

import { useRef, type ChangeEvent } from 'react';
import { Image as ImageIcon, Video } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  getMediaAccept,
  getMediaActionLabel,
  getMediaValue,
  removeMediaValue,
  type ColorValue,
} from './enhanced-color-picker-utils';

interface MediaUploadPanelProps {
  colorValue: ColorValue;
  icon: 'image' | 'video';
  label: string;
  mode: 'image' | 'video';
  onColorValueChange: (value: ColorValue) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function MediaUploadPanel({
  colorValue,
  icon,
  label,
  mode,
  onColorValueChange,
  onUpload,
}: MediaUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const value = getMediaValue(colorValue, mode);
  const Icon = icon === 'image' ? ImageIcon : Video;

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-2 block">{label}</Label>
        <input
          ref={inputRef}
          type="file"
          accept={getMediaAccept(mode)}
          onChange={onUpload}
          className="hidden"
        />
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} className="w-full">
          <Icon className="h-4 w-4 mr-2" />
          {getMediaActionLabel('Upload', mode)}
        </Button>
        {value && (
          <div className="mt-2">
            <div className="relative w-full h-32 rounded border overflow-hidden bg-black">
              {mode === 'image' ? (
                <img src={value} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <video src={value} className="w-full h-full object-cover" muted loop autoPlay />
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onColorValueChange(removeMediaValue(colorValue, mode))}
              className="w-full mt-2"
            >
              {getMediaActionLabel('Remove', mode)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
