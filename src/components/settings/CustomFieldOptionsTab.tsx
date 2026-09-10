import type { Control, FieldArrayWithId } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { ColorPicker } from "@/components/ui/color-picker";
import { GripVertical, List, Plus, Trash2 } from "lucide-react";
import type { CustomFieldOption } from "@/lib/types";

import type { CustomFieldFormValues } from "./CustomFieldDrawerParts";

interface CustomFieldOptionsTabProps {
  control: Control<CustomFieldFormValues>;
  optionsFields: FieldArrayWithId<CustomFieldFormValues, "options", "id">[];
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onUpdateOption: (
    index: number,
    field: keyof CustomFieldOption,
    value: string | boolean
  ) => void;
}

export function CustomFieldOptionsTab({
  control,
  optionsFields,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
}: CustomFieldOptionsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <List className="h-5 w-5 text-primary" />
            Field Options
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Define the available options for this select field
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <FormField
                control={control}
                name="allowCustomOptions"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Allow Custom Options</FormLabel>
                      <FormDescription>
                        Users can add new options when using this field
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddOption}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Option
            </Button>
          </div>

          {optionsFields.length > 0 && (
            <div className="space-y-3">
              <Label>Options</Label>
              {optionsFields.map((option, index) => (
                <div key={option.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      placeholder="Value"
                      value={option.value}
                      onChange={(event) => onUpdateOption(index, "value", event.target.value)}
                    />
                    <Input
                      placeholder="Label"
                      value={option.label}
                      onChange={(event) => onUpdateOption(index, "label", event.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <ColorPicker
                        value={option.color || "#3B82F6"}
                        onChange={(color) => onUpdateOption(index, "color", color)}
                      />
                      <Input
                        value={option.color || "#3B82F6"}
                        onChange={(event) => onUpdateOption(index, "color", event.target.value)}
                        className="w-20"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={option.isActive}
                      onCheckedChange={(checked) => onUpdateOption(index, "isActive", Boolean(checked))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveOption(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
