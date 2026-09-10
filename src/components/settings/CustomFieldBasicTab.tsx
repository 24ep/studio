import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CUSTOM_FIELD_TYPES } from "@/lib/types";
import { Building, Calendar, FileText, Info, User } from "lucide-react";
import type {
  CustomFieldFormTabProps,
  CustomFieldModelProps,
  CustomFieldTypeProps,
} from "./CustomFieldDrawerFormTabTypes";
import { TabSectionHeader } from "./CustomFieldDrawerFormTabTypes";

const FIELD_TYPE_ICONS = {
  text: FileText,
  textarea: FileText,
  number: FileText,
  boolean: FileText,
  date: Calendar,
  select_single: FileText,
  select_multiple: FileText,
};

const MODEL_ICONS: Record<string, typeof User> = {
  Applicant: User,
  Position: Building,
  User: User,
  Headcount: Building,
};

export function CustomFieldBasicTab({
  form,
  modelName,
  fieldType,
}: CustomFieldFormTabProps & CustomFieldModelProps & CustomFieldTypeProps) {
  const ModelIcon = MODEL_ICONS[modelName] || User;
  const FieldTypeIcon = FIELD_TYPE_ICONS[fieldType] || FileText;

  return (
    <div className="space-y-6">
      <div>
        <TabSectionHeader
          icon={<FileText className="h-5 w-5 text-primary" />}
          title="Field Configuration"
          description="Define the basic properties and type of your custom field"
        />
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ModelTypeField form={form} ModelIcon={ModelIcon} />
            <FieldTypeField form={form} FieldTypeIcon={FieldTypeIcon} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FieldCodeField form={form} />
            <DisplayLabelField form={form} />
          </div>
        </div>
      </div>

      <div>
        <TabSectionHeader
          icon={<Info className="h-5 w-5 text-primary" />}
          title="Field Properties"
          description="Configure additional field properties and requirements"
        />
        <FormField
          control={form.control}
          name="is_required"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Required Field</FormLabel>
                <FormDescription>
                  This field must be filled when creating/editing {modelName.toLowerCase()}s
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function ModelTypeField({
  form,
  ModelIcon,
}: CustomFieldFormTabProps & {
  ModelIcon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <FormField
      control={form.control}
      name="model_name"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            <ModelIcon className="h-4 w-4" />
            Model Type
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select model type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="Applicant">Applicant</SelectItem>
              <SelectItem value="Position">Position</SelectItem>
              <SelectItem value="User">User</SelectItem>
              <SelectItem value="Headcount">Headcount</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function FieldTypeField({
  form,
  FieldTypeIcon,
}: CustomFieldFormTabProps & {
  FieldTypeIcon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <FormField
      control={form.control}
      name="field_type"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            <FieldTypeIcon className="h-4 w-4" />
            Field Type
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select field type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {CUSTOM_FIELD_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace("_", " ").toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function FieldCodeField({ form }: CustomFieldFormTabProps) {
  return (
    <FormField
      control={form.control}
      name="field_code"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Field Code</FormLabel>
          <FormControl>
            <Input placeholder="e.g., CUSTOM_STATUS" {...field} />
          </FormControl>
          <FormDescription>
            Unique identifier (uppercase, alphanumeric, underscores only)
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function DisplayLabelField({ form }: CustomFieldFormTabProps) {
  return (
    <FormField
      control={form.control}
      name="label"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Display Label</FormLabel>
          <FormControl>
            <Input placeholder="e.g., Custom Status" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
