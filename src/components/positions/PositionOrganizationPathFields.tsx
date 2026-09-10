"use client";

import { useState, type ComponentType, type ReactNode } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { Building2, BriefcaseBusiness, Check, ChevronRight, ChevronsUpDown, Layers3, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { AddPositionFormValues } from './add-position-form';

export type OrganizationUnitOption = {
  id: string;
  name: string;
  parentId: string | null;
  unitType: 'division' | 'department' | 'section' | 'unit';
};

const LEVELS = [
  { name: 'divisionId', label: 'Division *', type: 'division', icon: Building2 },
  { name: 'departmentId', label: 'Department *', type: 'department', icon: BriefcaseBusiness },
  { name: 'sectionId', label: 'Section *', type: 'section', icon: Layers3 },
  { name: 'unitId', label: 'Unit / Location *', type: 'unit', icon: MapPin },
] as const;

export function PositionOrganizationPathFields({
  form,
  units,
  disabled = false,
  mobile = false,
  detailsBeforeUnit,
  unitCompanion,
}: {
  form: UseFormReturn<AddPositionFormValues>;
  units: OrganizationUnitOption[];
  disabled?: boolean;
  mobile?: boolean;
  detailsBeforeUnit?: ReactNode;
  unitCompanion?: ReactNode;
}) {
  const values = form.watch(['divisionId', 'departmentId', 'sectionId', 'unitId']);

  const renderLevel = (level: typeof LEVELS[number], index: number, className?: string) => {
      const parentId = index === 0 ? null : values[index - 1];
      const options = units.filter(unit => unit.unitType === level.type && unit.parentId === parentId);
      const error = form.formState.errors[level.name]?.message;
      return (
        <div key={level.name} className={cn(mobile ? 'space-y-2' : 'space-y-1.5', className)}>
          {(mobile || index === 3) && <Label>{level.label}</Label>}
          <div>
            <Controller
              name={level.name}
              control={form.control}
              render={({ field }) => (
                <SearchableOrganizationSelect
                  disabled={disabled || (index > 0 && !parentId)}
                  icon={level.icon}
                  label={level.label.replace(' *', '').toLowerCase()}
                  options={options}
                  value={field.value}
                  onChange={(id) => {
                    field.onChange(id);
                    for (let child = index + 1; child < LEVELS.length; child += 1) {
                      form.setValue(LEVELS[child].name, '');
                    }
                    if (level.type === 'department') {
                      form.setValue('department', options.find(option => option.id === id)?.name || '', { shouldValidate: true });
                    } else if (index < 1) {
                      form.setValue('department', '');
                    }
                  }}
                />
              )}
            />
            {error && <p className="text-sm text-destructive mt-1">{error}</p>}
          </div>
        </div>
      );
  };

  if (mobile) {
    return <>{LEVELS.map((level, index) => renderLevel(level, index))}</>;
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Organization path *</Label>
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
          {LEVELS.slice(0, 3).map((level, index) => (
            <div key={level.name} className="contents">
              {renderLevel(level, index)}
              {index < 2 && <ChevronRight className="mt-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Later choices depend on earlier selections.</p>
      </div>
      {detailsBeforeUnit}
      <div className="grid gap-5 md:grid-cols-2">
        {renderLevel(LEVELS[3], 3)}
        {unitCompanion}
      </div>
    </div>
  );
}

function SearchableOrganizationSelect({ disabled, icon: Icon, label, onChange, options, value }: {
  disabled: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onChange: (value: string) => void;
  options: OrganizationUnitOption[];
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} disabled={disabled} className="w-full justify-between font-normal">
          <span className="flex min-w-0 items-center gap-2">
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={cn('truncate', !selected && 'text-muted-foreground')}>
              {selected?.name || `Select ${label}`}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${label}...`} />
          <CommandList>
            <CommandEmpty>No {label} found.</CommandEmpty>
            <CommandGroup>
              {options.map(option => (
                <CommandItem key={option.id} value={option.name} onSelect={() => { onChange(option.id); setOpen(false); }}>
                  <Check className={cn('mr-2 h-4 w-4', value === option.id ? 'opacity-100' : 'opacity-0')} />
                  {option.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
