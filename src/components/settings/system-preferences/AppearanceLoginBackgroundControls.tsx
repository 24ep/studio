import { ImageUp, X } from "lucide-react";
import type React from "react";

import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  convertHslStringToHex,
  hexToHslString,
} from "./utils";
import { SystemPreferenceRow } from "./SystemPreferenceRows";

interface LoginBackgroundImageControlProps {
  canEdit: boolean;
  imagePreviewUrl: string | null;
  isMobile: boolean;
  onImageFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (shouldRemoveSaved: boolean) => void;
  uploadId: string;
}

export function LoginBackgroundImageControl({
  canEdit,
  imagePreviewUrl,
  isMobile,
  onImageFileChange,
  onRemoveImage,
  uploadId,
}: LoginBackgroundImageControlProps) {
  return (
    <SystemPreferenceRow
      label={`Background Image${isMobile ? " (Mobile)" : ""}`}
      description={isMobile ? "Recommended: 1080x1920 vertical image, max 500KB." : "Recommended: 1920x1080 image, max 500KB."}
    >
      <div className="flex items-center gap-4">
        {imagePreviewUrl && (
          <div className="relative">
            <img
              src={imagePreviewUrl}
              alt={isMobile ? "Login background preview mobile" : "Login background preview"}
              className="h-20 w-32 rounded-md border object-cover"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute -right-2 -top-2 h-6 w-6"
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
            id={uploadId}
          />
          <Label
            htmlFor={uploadId}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <ImageUp className="mr-2 h-4 w-4" />
            Upload Image
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            {isMobile ? "Recommended: 1080x1920 (Vertical), max 500KB" : "Recommended: 1920x1080, max 500KB"}
          </p>
        </div>
      </div>
    </SystemPreferenceRow>
  );
}

interface LoginBackgroundGradientControlProps {
  backgroundGradient: string | null;
  canEdit: boolean;
  defaultGradient: string;
  isMobile: boolean;
  onChange: (value: string) => void;
}

export function LoginBackgroundGradientControl({
  backgroundGradient,
  canEdit,
  defaultGradient,
  isMobile,
  onChange,
}: LoginBackgroundGradientControlProps) {
  return (
    <SystemPreferenceRow
      label={`Gradient Colors${isMobile ? " (Mobile)" : ""}`}
      description="Set the gradient used behind the login page."
    >
      <ColorPicker
        value={backgroundGradient || defaultGradient}
        onChange={onChange}
        disabled={!canEdit}
        className="w-full"
      />
    </SystemPreferenceRow>
  );
}

interface LoginBackgroundSolidControlProps {
  backgroundColor: string;
  canEdit: boolean;
  isMobile: boolean;
  onChange: (value: string) => void;
}

export function LoginBackgroundSolidControl({
  backgroundColor,
  canEdit,
  isMobile,
  onChange,
}: LoginBackgroundSolidControlProps) {
  return (
    <SystemPreferenceRow
      label={`Background Color${isMobile ? " (Mobile)" : ""}`}
      description="Set the solid color used behind the login page."
    >
      <ColorPicker
        value={convertHslStringToHex(backgroundColor)}
        onChange={(hex) => onChange(hexToHslString(hex))}
        disabled={!canEdit}
        className="w-full"
      />
    </SystemPreferenceRow>
  );
}
