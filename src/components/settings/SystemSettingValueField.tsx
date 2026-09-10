"use client";

import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SystemSettingBooleanSelect } from "./SystemSettingBooleanSelect";
import { SystemSettingImageValueField } from "./SystemSettingImageValueField";
import { isSidebarColorSetting } from "./system-setting-color-utils";
import {
  SidebarColorValueField,
  uploadSystemSettingImage,
} from "./SystemSettingValueFieldParts";

interface SystemSettingValueFieldProps {
  settingKey: string;
  value: string | null;
  onValueChange: (value: string) => void;
}

export function SystemSettingValueField({
  settingKey,
  value,
  onValueChange,
}: SystemSettingValueFieldProps) {
  const settingValue = value || "";

  if (settingKey.includes("Url") || settingKey.includes("webhook")) {
    return (
      <Textarea
        id="value"
        value={settingValue}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder="Enter URL or webhook endpoint"
        rows={3}
      />
    );
  }

  if (settingKey.includes("DataUrl")) {
    return (
      <SystemSettingImageValueField
        value={settingValue}
        onFileChange={(event) => uploadSystemSettingImage(event, onValueChange)}
        onRemove={() => onValueChange("")}
        onValueChange={onValueChange}
      />
    );
  }

  if (settingKey.includes("ApiKey") || settingKey.includes("Secret")) {
    return (
      <Input
        id="value"
        type="password"
        value={settingValue}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder="Enter API key or secret"
      />
    );
  }

  if (settingKey.includes("Port")) {
    return (
      <Input
        id="value"
        type="number"
        value={settingValue}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder="Enter port number"
      />
    );
  }

  if (settingKey === "queueRetryEnabled") {
    return (
      <SystemSettingBooleanSelect
        value={settingValue || "false"}
        trueLabel="Enabled"
        falseLabel="Disabled"
        onValueChange={onValueChange}
      />
    );
  }

  if (settingKey.includes("Secure") || settingKey.includes("Required") || settingKey.includes("Enabled")) {
    return <SystemSettingBooleanSelect value={settingValue} onValueChange={onValueChange} />;
  }

  if (settingKey === "queueRetryDelaySeconds") {
    return (
      <Input
        id="value"
        type="number"
        min="0"
        value={settingValue || "5"}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder="Retry delay in seconds (e.g., 5)"
      />
    );
  }

  if (settingKey === "queueMaxRetries") {
    return (
      <Input
        id="value"
        type="number"
        min="0"
        value={settingValue || "3"}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder="Max retries (e.g., 3)"
      />
    );
  }

  if (settingKey === "emailTemplateInterviewInvitationEditorMode") {
    return (
      <Select value={settingValue || "wysiwyg"} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select editor mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="wysiwyg">WYSIWYG (Rich Text)</SelectItem>
          <SelectItem value="html">HTML (Code)</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (settingKey === "mobileHeaderBackgroundType") {
    return (
      <Select value={settingValue || "gradient"} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select background type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gradient">Gradient (Default)</SelectItem>
          <SelectItem value="transparent">Transparent (Match Body)</SelectItem>
          <SelectItem value="solid">Solid Color</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (isSidebarColorSetting(settingKey)) {
    return (
      <SidebarColorValueField
        value={settingValue}
        onValueChange={onValueChange}
      />
    );
  }

  if (settingKey.includes("Color")) {
    return (
      <div className="space-y-2">
        <ColorPicker
          value={settingValue || "#000000"}
          onChange={onValueChange}
          className="w-full"
        />
        <Input
          id="value"
          value={settingValue}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder="Enter color (Hex or Name)"
        />
      </div>
    );
  }

  return (
    <Input
      id="value"
      value={settingValue}
      onChange={(event) => onValueChange(event.target.value)}
      placeholder="Enter value"
    />
  );
}
