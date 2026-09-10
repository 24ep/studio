"use client";

import type { ChangeEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function SystemSettingImageValueField({
  value,
  onFileChange,
  onRemove,
  onValueChange,
}: {
  value: string;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      {value && (
        <div className="relative w-full max-w-[200px] h-20 border rounded-md overflow-hidden bg-muted/50 flex items-center justify-center">
          <img
            src={value}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            aria-label="Remove image"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <Input
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="cursor-pointer"
      />
      <p className="text-xs text-muted-foreground">
        Recommended: PNG or JPG, max 2MB.
      </p>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or enter image URL</span>
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder="https://... or data:image/..."
        rows={2}
        className="font-mono text-xs"
      />
    </div>
  );
}
