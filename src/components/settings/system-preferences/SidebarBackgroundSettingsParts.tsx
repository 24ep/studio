import type { ChangeEvent } from "react";
import { ImageUp, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  SidebarBackgroundType,
  SidebarImageFit,
  SidebarImagePosition,
} from "./constants";
import {
  SIDEBAR_IMAGE_FIT_OPTIONS,
  SIDEBAR_IMAGE_POSITION_OPTIONS,
} from "./sidebar-background-settings-options";
import { SystemPreferenceRow } from "./SystemPreferenceRows";

type SidebarSelectOption<TValue extends string> = {
  label: string;
  value: TValue;
};

interface SidebarOptionSelectProps<TValue extends string> {
  canEdit: boolean;
  description?: string;
  label: string;
  onValueChange: (value: TValue) => void;
  options: SidebarSelectOption<TValue>[];
  placeholder?: string;
  value: TValue;
}

export function SidebarOptionSelect<TValue extends string>({
  canEdit,
  description,
  label,
  onValueChange,
  options,
  placeholder,
  value,
}: SidebarOptionSelectProps<TValue>) {
  return (
    <SystemPreferenceRow label={label} description={description}>
      <Select
        value={value}
        onValueChange={(nextValue) => onValueChange(nextValue as TValue)}
        disabled={!canEdit}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SystemPreferenceRow>
  );
}

interface SidebarPercentSliderProps {
  canEdit: boolean;
  description?: string;
  label: string;
  onValueChange: (value: number) => void;
  value: number;
}

export function SidebarPercentSlider({
  canEdit,
  description,
  label,
  onValueChange,
  value,
}: SidebarPercentSliderProps) {
  const normalizedValue = Math.min(100, Math.max(0, Math.round(value || 0)));

  return (
    <SystemPreferenceRow label={label} description={description}>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Slider
            value={[normalizedValue]}
            min={0}
            max={100}
            step={1}
            disabled={!canEdit}
            onValueChange={([nextValue]) => onValueChange(nextValue ?? 0)}
            className="flex-1"
          />
          <span className="w-12 text-right text-sm tabular-nums text-muted-foreground">
            {normalizedValue}%
          </span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
    </SystemPreferenceRow>
  );
}

interface SidebarImageSettingsProps {
  canEdit: boolean;
  handleSidebarImageFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  removeSelectedSidebarImage: (shouldRemoveSaved: boolean) => void;
  savedSidebarImageUrl: string | null;
  setSidebarImageFit: (value: SidebarImageFit) => void;
  setSidebarImagePosition: (value: SidebarImagePosition) => void;
  sidebarImageFit: SidebarImageFit;
  sidebarImagePosition: SidebarImagePosition;
  sidebarImagePreviewUrl: string | null;
}

export function SidebarImageSettings({
  canEdit,
  sidebarImagePreviewUrl,
  savedSidebarImageUrl,
  removeSelectedSidebarImage,
  handleSidebarImageFileChange,
  sidebarImageFit,
  setSidebarImageFit,
  sidebarImagePosition,
  setSidebarImagePosition,
}: SidebarImageSettingsProps) {
  return (
    <>
      <SystemPreferenceRow
        label="Background Image"
        description="Upload the image used behind the secondary sidebar menu."
      >
      <div className="flex items-center gap-4">
        <SidebarImagePreview
          canEdit={canEdit}
          imageUrl={sidebarImagePreviewUrl || savedSidebarImageUrl}
          onRemove={() => removeSelectedSidebarImage(true)}
        />
        <SidebarImageUploadControl
          canEdit={canEdit}
          onChange={handleSidebarImageFileChange}
        />
      </div>
      </SystemPreferenceRow>

      <SidebarOptionSelect
        canEdit={canEdit}
        description="Control how the uploaded sidebar image fills the available menu area."
        label="Image Fit"
        value={sidebarImageFit}
        onValueChange={setSidebarImageFit}
        options={SIDEBAR_IMAGE_FIT_OPTIONS}
      />
      <SidebarOptionSelect
        canEdit={canEdit}
        description="Choose the focal position for the uploaded sidebar image."
        label="Position"
        value={sidebarImagePosition}
        onValueChange={setSidebarImagePosition}
        options={SIDEBAR_IMAGE_POSITION_OPTIONS}
      />
    </>
  );
}

interface SidebarImagePreviewProps {
  canEdit: boolean;
  imageUrl: string | null;
  onRemove: () => void;
}

function SidebarImagePreview({
  canEdit,
  imageUrl,
  onRemove,
}: SidebarImagePreviewProps) {
  if (!imageUrl) {
    return (
      <div className="flex h-32 w-24 items-center justify-center rounded-md border-2 border-dashed bg-muted/50">
        <ImageUp className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative h-32 w-24 overflow-hidden rounded-md border">
      <img
        src={imageUrl}
        alt="Sidebar background"
        className="h-full w-full object-cover"
      />
      <Button
        size="icon"
        variant="destructive"
        className="absolute right-1 top-1 h-6 w-6 rounded-full"
        onClick={onRemove}
        disabled={!canEdit}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface SidebarImageUploadControlProps {
  canEdit: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

function SidebarImageUploadControl({
  canEdit,
  onChange,
}: SidebarImageUploadControlProps) {
  return (
    <div className="flex-1 space-y-2">
      <Input
        type="file"
        accept="image/*"
        onChange={onChange}
        disabled={!canEdit}
        className="hidden"
        id="sidebar-bg-image-upload"
      />
      <Label
        htmlFor="sidebar-bg-image-upload"
        className="inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        Upload Image
      </Label>
      <p className="text-xs text-muted-foreground">
        Recommended: Vertical image, optimized for web (jpg/webp)
      </p>
    </div>
  );
}
