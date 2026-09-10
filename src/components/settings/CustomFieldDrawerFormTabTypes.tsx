import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";

import { Label } from "@/components/ui/label";
import type { CustomFieldType } from "@/lib/types";
import type { CustomFieldFormValues } from "./CustomFieldDrawerParts";

export interface CustomFieldFormTabProps {
  form: UseFormReturn<CustomFieldFormValues>;
}

export interface CustomFieldModelProps {
  modelName: CustomFieldFormValues["model_name"];
}

export interface CustomFieldTypeProps {
  fieldType: CustomFieldType;
}

export function TabSectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <h3 className="flex items-center gap-2 text-lg font-semibold">
        {icon}
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function InfoValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <p className="font-medium">{value}</p>
    </div>
  );
}
