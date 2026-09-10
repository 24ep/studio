"use client";

import type { ChangeEvent } from "react";
import { Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TreeItemIconFieldsProps {
  iconFile: File | null;
  iconPreview: string | null;
  iconUrl: string;
  idPrefix: string;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onIconUrlChange: (value: string) => void;
  onRemoveIcon: () => void;
}

export function TreeItemIconFields({
  iconFile,
  iconPreview,
  iconUrl,
  idPrefix,
  onFileUpload,
  onIconUrlChange,
  onRemoveIcon,
}: TreeItemIconFieldsProps) {
  const iconInputId = `${idPrefix}-icon`;

  return (
    <div>
      <Label htmlFor={iconInputId}>Icon</Label>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Input
            id={iconInputId}
            type="file"
            accept="image/*"
            onChange={onFileUpload}
            className="file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/80"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById(iconInputId)?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Icon
          </Button>
        </div>

        {iconPreview && (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
            <img
              src={iconPreview}
              alt="Icon preview"
              className="h-12 w-12 rounded object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Icon Preview</p>
              <p className="text-xs text-muted-foreground">
                {iconFile ? iconFile.name : "Current icon"}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onRemoveIcon}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div>
          <Label htmlFor={`${idPrefix}-icon-url`}>Or enter icon URL</Label>
          <Input
            id={`${idPrefix}-icon-url`}
            value={iconUrl}
            onChange={(event) => onIconUrlChange(event.target.value)}
            placeholder="Optional icon URL"
          />
        </div>
      </div>
    </div>
  );
}
