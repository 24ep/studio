import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { SystemSettingValueField } from "./SystemSettingValueField";
import { ALLOWED_SYSTEM_SETTING_KEYS, type SystemSettingsFormProps } from "./SystemSettingsFormTypes";
import { useSystemSettingsForm } from "./use-system-settings-form";

function SystemSettingsForm({
  open,
  setting,
  onClose,
  onSubmit,
  isSaving = false,
}: SystemSettingsFormProps) {
  const { formData, handleInputChange, handleSubmit } = useSystemSettingsForm({
    setting,
    onSubmit,
  });

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {setting ? "Edit System Setting" : "Add System Setting"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key">Setting Key</Label>
            {setting ? (
              <Input
                id="key"
                value={formData.key}
                onChange={(event) => handleInputChange("key", event.target.value)}
                placeholder="e.g., appName, geminiApiKey"
                disabled
                required
              />
            ) : (
              <Select
                value={formData.key}
                onValueChange={(value) => handleInputChange("key", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select setting key" />
                </SelectTrigger>
                <SelectContent>
                  {ALLOWED_SYSTEM_SETTING_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Value</Label>
            <SystemSettingValueField
              settingKey={formData.key}
              value={formData.value}
              onValueChange={(value) => handleInputChange("value", value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="submit"
              disabled={isSaving || !formData.key.trim()}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SystemSettingsForm;
