import { ImageUp, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ColorPicker } from '@/components/ui/color-picker';
import { convertHslStringToHex, hexToHslString } from './utils';
import type { EvaluateHeaderBackgroundType } from './constants';
import { EVALUATE_HEADER_BACKGROUND_TYPE_OPTIONS } from './evaluate-tab-utils';
import { SystemPreferenceRow } from './SystemPreferenceRows';

interface EvaluateHeaderBackgroundTypeSelectProps {
  canEdit: boolean;
  value: EvaluateHeaderBackgroundType;
  onChange: (value: EvaluateHeaderBackgroundType) => void;
}

export function EvaluateHeaderBackgroundTypeSelect({
  canEdit,
  value,
  onChange,
}: EvaluateHeaderBackgroundTypeSelectProps) {
  return (
    <SystemPreferenceRow
      htmlFor="eval-bg-type"
      label="Header Background Type"
      description="Choose the source used behind the evaluation page header."
    >
      <Select
        value={value}
        onValueChange={(nextValue) => onChange(nextValue as EvaluateHeaderBackgroundType)}
        disabled={!canEdit}
      >
        <SelectTrigger id="eval-bg-type" className="w-full">
          <SelectValue placeholder="Select background type" />
        </SelectTrigger>
        <SelectContent>
          {EVALUATE_HEADER_BACKGROUND_TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SystemPreferenceRow>
  );
}

interface EvaluateHeaderImageSectionProps {
  canEdit: boolean;
  previewImageSrc: string | null;
  onRemoveImage: (shouldRemoveSaved: boolean) => void;
  onImageFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function EvaluateHeaderImageSection({
  canEdit,
  previewImageSrc,
  onRemoveImage,
  onImageFileChange,
}: EvaluateHeaderImageSectionProps) {
  return (
    <SystemPreferenceRow
      label="Header Background Image"
      description="Recommended: 1920x200px banner."
    >
      <div className="flex items-center gap-4">
        {previewImageSrc && (
          <div className="relative">
            <img
              src={previewImageSrc}
              alt="Background preview"
              className="w-32 h-16 object-cover rounded-md border"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={() => onRemoveImage(true)}
              disabled={!canEdit}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        <div className="flex-1">
          <Input
            type="file"
            accept="image/*"
            onChange={onImageFileChange}
            disabled={!canEdit}
            className="hidden"
            id="eval-header-bg-upload"
          />
          <Label
            htmlFor="eval-header-bg-upload"
            className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            <ImageUp className="mr-2 h-4 w-4" />
            Upload Image
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Recommended: 1920x200px (Banner)
          </p>
        </div>
      </div>
    </SystemPreferenceRow>
  );
}

interface EvaluateHeaderGradientSectionProps {
  canEdit: boolean;
  value: string | null;
  defaultGradient: string;
  onChange: (value: string) => void;
}

export function EvaluateHeaderGradientSection({
  canEdit,
  value,
  defaultGradient,
  onChange,
}: EvaluateHeaderGradientSectionProps) {
  return (
    <SystemPreferenceRow
      label="Gradient Colors"
      description="Set the gradient used by the evaluation header."
    >
      <ColorPicker
        value={value || defaultGradient}
        onChange={onChange}
        disabled={!canEdit}
        className="w-full"
      />
    </SystemPreferenceRow>
  );
}

interface EvaluateHeaderSolidColorSectionProps {
  canEdit: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function EvaluateHeaderSolidColorSection({
  canEdit,
  value,
  onChange,
}: EvaluateHeaderSolidColorSectionProps) {
  return (
    <SystemPreferenceRow
      label="Background Color"
      description="Set a single solid color for the evaluation header."
    >
      <ColorPicker
        value={convertHslStringToHex(value)}
        onChange={(hex) => onChange(hexToHslString(hex))}
        disabled={!canEdit}
        className="w-full"
      />
    </SystemPreferenceRow>
  );
}

interface EvaluateHeaderTextColorSectionProps {
  canEdit: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function EvaluateHeaderTextColorSection({
  canEdit,
  value,
  onChange,
}: EvaluateHeaderTextColorSectionProps) {
  return (
    <SystemPreferenceRow
      label="Header Text Color"
      description="Adjust text/icon color for readability on the header."
    >
      <ColorPicker
        value={convertHslStringToHex(value)}
        onChange={(hex) => onChange(hexToHslString(hex))}
        disabled={!canEdit}
        className="w-full"
      />
    </SystemPreferenceRow>
  );
}
