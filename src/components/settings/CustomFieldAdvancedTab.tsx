import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Database, Settings } from "lucide-react";
import type {
  CustomFieldFormTabProps,
  CustomFieldModelProps,
  CustomFieldTypeProps,
} from "./CustomFieldDrawerFormTabTypes";
import { InfoValue, TabSectionHeader } from "./CustomFieldDrawerFormTabTypes";

export function CustomFieldAdvancedTab({
  form,
  modelName,
  fieldType,
  isSelectType,
  optionsCount,
}: CustomFieldFormTabProps &
  CustomFieldModelProps &
  CustomFieldTypeProps & {
    isSelectType: boolean;
    optionsCount: number;
  }) {
  return (
    <div className="space-y-6">
      <div>
        <TabSectionHeader
          icon={<Settings className="h-5 w-5 text-primary" />}
          title="Display Settings"
          description="Configure advanced display and ordering settings"
        />
        <FormField
          control={form.control}
          name="sort_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sort Order</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  onChange={(event) => field.onChange(parseInt(event.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>Lower numbers appear first in lists and forms</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div>
        <TabSectionHeader
          icon={<Database className="h-5 w-5 text-primary" />}
          title="Field Information"
          description="Technical details about this custom field"
        />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoValue label="Model" value={modelName} />
            <InfoValue label="Type" value={fieldType.replace("_", " ").toUpperCase()} />
            <InfoValue label="Required" value={form.watch("is_required") ? "Yes" : "No"} />
            <InfoValue label="Options Count" value={isSelectType ? String(optionsCount) : "N/A"} />
          </div>
        </div>
      </div>
    </div>
  );
}
