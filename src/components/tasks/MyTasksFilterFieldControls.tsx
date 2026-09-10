import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FilterField({
  children,
  icon,
  label,
}: {
  children: ReactNode;
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center gap-2">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}

export function NumberFilterInput({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: number | undefined) => void;
  placeholder: string;
  value: unknown;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        min={0}
        max={100}
        value={typeof value === "number" || typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : undefined)}
        placeholder={placeholder}
        className="h-9"
      />
    </div>
  );
}

export function DateFilterInput({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string | undefined) => void;
  value: unknown;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="date"
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value || undefined)}
        className="h-9"
      />
    </div>
  );
}

export function SelectFilter({
  icon,
  label,
  onChange,
  options,
  placeholder,
  selectId,
  value,
}: {
  icon: ReactNode;
  label: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
  placeholder: string;
  selectId: string;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent selectId={selectId}>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
