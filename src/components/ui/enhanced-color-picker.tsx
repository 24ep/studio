"use client";

import { Image as ImageIcon, Video, Palette, Layers, FileImage } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  GradientPanel,
  MediaUploadPanel,
  SolidColorPanel,
  TexturePanel,
} from './enhanced-color-picker-panels';
import { type ColorMode, type ColorValue } from './enhanced-color-picker-utils';
import { useEnhancedColorPickerController } from './use-enhanced-color-picker';

export type { ColorMode, ColorValue, GradientStop, GradientType } from './enhanced-color-picker-utils';

interface EnhancedColorPickerProps {
  value: string | ColorValue;
  onChange: (value: string) => void;
  className?: string;
  allowBackground?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function EnhancedColorPicker({
  value,
  onChange,
  className,
  allowBackground = false,
  placeholder = '#000000',
  disabled = false,
}: EnhancedColorPickerProps) {
  const picker = useEnhancedColorPickerController({ onChange, value });

  return (
    <Popover open={picker.open} onOpenChange={picker.setOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative flex items-center w-full', className)}>
          <div
            className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded border-2 border-border cursor-pointer z-10"
            style={picker.previewStyle}
            onClick={(event) => {
              event.preventDefault();
              if (!disabled) picker.setOpen(true);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={picker.handlePreviewKeyDown}
          />
          <Input
            type="text"
            value={picker.displayText}
            readOnly
            placeholder={placeholder}
            disabled={disabled}
            className="pl-10 cursor-pointer"
            onClick={() => !disabled && picker.setOpen(true)}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start" popoverId="enhanced-color-picker">
        <Tabs
          value={picker.activeTab}
          onValueChange={(tab) => picker.setActiveTab(tab as ColorMode)}
          className="w-full"
        >
          <TabsList variant="subnav" className="w-full rounded-none rounded-t-lg">
            <TabsTrigger value="solid" className="flex-1">
              <Palette className="w-4 h-4 mr-1" />
              Solid
            </TabsTrigger>
            <TabsTrigger value="gradient" className="flex-1">
              <Layers className="w-4 h-4 mr-1" />
              Gradient
            </TabsTrigger>
            <TabsTrigger value="texture" className="flex-1">
              <FileImage className="w-4 h-4 mr-1" />
              Texture
            </TabsTrigger>
            {allowBackground && (
              <>
                <TabsTrigger value="image" className="flex-1">
                  <ImageIcon className="w-4 h-4 mr-1" />
                  Image
                </TabsTrigger>
                <TabsTrigger value="video" className="flex-1">
                  <Video className="w-4 h-4 mr-1" />
                  Video
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <div className="p-4">
            <TabsContent value="solid" className="mt-0">
              <SolidColorPanel
                colorValue={picker.colorValue}
                onColorValueChange={picker.handleColorValueChange}
                onSolidColorChange={picker.handleSolidColorChange}
              />
            </TabsContent>

            <TabsContent value="gradient" className="mt-0">
              <GradientPanel
                colorValue={picker.colorValue}
                onAddGradientStop={picker.handleAddGradientStop}
                onCreateGradient={picker.handleCreateGradient}
                onGradientAngleChange={picker.handleGradientAngleChange}
                onGradientPositionChange={picker.handleGradientPositionChange}
                onGradientSizeChange={picker.handleGradientSizeChange}
                onGradientStopChange={picker.handleGradientStopChange}
                onGradientTypeChange={picker.handleGradientTypeChange}
                onRemoveGradientStop={picker.handleRemoveGradientStop}
              />
            </TabsContent>

            <TabsContent value="texture" className="mt-0">
              <TexturePanel colorValue={picker.colorValue} onTextureChange={picker.handleTextureChange} />
            </TabsContent>

            {allowBackground && (
              <>
                <TabsContent value="image" className="mt-0">
                  <MediaUploadPanel
                    colorValue={picker.colorValue}
                    icon="image"
                    label="Background Image"
                    mode="image"
                    onColorValueChange={picker.handleColorValueChange}
                    onUpload={(event) => picker.handleMediaUpload('image', event)}
                  />
                </TabsContent>

                <TabsContent value="video" className="mt-0">
                  <MediaUploadPanel
                    colorValue={picker.colorValue}
                    icon="video"
                    label="Background Video"
                    mode="video"
                    onColorValueChange={picker.handleColorValueChange}
                    onUpload={(event) => picker.handleMediaUpload('video', event)}
                  />
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
