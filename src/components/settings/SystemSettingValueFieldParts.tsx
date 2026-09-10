"use client";

import type { ChangeEvent } from "react";
import { toast } from "react-hot-toast";

import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { getJsonString, readJsonObject } from "@/lib/response-json";

import { hexToHslString, hslStringToHex } from "./system-setting-color-utils";

export async function uploadSystemSettingImage(
  event: ChangeEvent<HTMLInputElement>,
  onValueChange: (value: string) => void,
) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    toast.error("File size must be less than 5MB");
    return;
  }

  try {
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("type", "settings");

    const loadingToast = toast.loading("Uploading image...");
    const response = await fetch("/api/upload-image", {
      method: "POST",
      body: uploadFormData,
    });

    if (!response.ok) throw new Error("Upload failed");

    const data = await readJsonObject(response);
    const url = getJsonString(data, "url");
    if (!url) {
      throw new Error("Upload response missing URL");
    }

    onValueChange(url);
    toast.success("Image uploaded successfully", { id: loadingToast });
  } catch (error) {
    console.error("Upload error:", error);
    toast.error("Failed to upload image");
  }
}

export function SidebarColorValueField({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <ColorPicker
        value={value ? hslStringToHex(value) : "#ffffff"}
        onChange={(hex) => onValueChange(hexToHslString(hex))}
        className="w-full"
      />
      <Input
        id="value"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder="e.g., 220 25% 97% (HSL values)"
        className="text-xs"
      />
    </div>
  );
}
