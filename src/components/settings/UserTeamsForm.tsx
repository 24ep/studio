"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2,
  BriefcaseBusiness,
  Building,
  Filter,
  GripVertical,
  MapPin,
  Plus,
  SlidersHorizontal,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import * as z from 'zod';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const teamAssignmentConditionValues = z.array(z.string().trim().min(1)).transform((values) =>
  values.map((value) => value.trim())
);

const teamAssignmentConditionsSchema = z.object({
  department: teamAssignmentConditionValues.optional().default([]),
  officeLocation: teamAssignmentConditionValues.optional().default([]),
  positionTitle: teamAssignmentConditionValues.optional().default([]),
  employeeType: teamAssignmentConditionValues.optional().default([]),
  companyName: teamAssignmentConditionValues.optional().default([]),
  manager: teamAssignmentConditionValues.optional().default([]),
});

export const teamFormSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  assignmentMode: z.enum(['manual', 'automatic']).optional().default('manual'),
  assignmentConditions: teamAssignmentConditionsSchema.optional().default({}),
}).refine(
  (team) => {
    if (team.assignmentMode !== 'automatic') {
      return true;
    }

    const { assignmentConditions } = team;
    return (
      (assignmentConditions.department?.length || 0) > 0
      || (assignmentConditions.officeLocation?.length || 0) > 0
      || (assignmentConditions.positionTitle?.length || 0) > 0
      || (assignmentConditions.employeeType?.length || 0) > 0
      || (assignmentConditions.companyName?.length || 0) > 0
      || (assignmentConditions.manager?.length || 0) > 0
    );
  },
  {
    message: 'Add at least one condition for automatic assignment mode.',
    path: ['assignmentConditions'],
  }
);

export type TeamFormValues = z.infer<typeof teamFormSchema>;

export const teamFormResolver = zodResolver(teamFormSchema);

export const EMPTY_TEAM_FORM_VALUES: TeamFormValues = {
  name: '',
  description: '',
  color: '#3B82F6',
  isActive: true,
  assignmentMode: 'manual',
  assignmentConditions: {
    department: [],
    officeLocation: [],
    positionTitle: [],
    employeeType: [],
    companyName: [],
    manager: [],
  },
};

const ASSIGNMENT_FIELD_LABELS = [
  { key: 'department', label: 'Department', icon: Building2 },
  { key: 'officeLocation', label: 'Office location', icon: MapPin },
  { key: 'positionTitle', label: 'Position title', icon: BriefcaseBusiness },
  { key: 'employeeType', label: 'Employee type', icon: UsersRound },
  { key: 'companyName', label: 'Company name', icon: Building },
  { key: 'manager', label: 'Manager', icon: UserRound },
] satisfies Array<{
  key: keyof TeamFormValues['assignmentConditions'];
  label: string;
  icon: typeof Building2;
}>;

type AssignmentFieldKey = (typeof ASSIGNMENT_FIELD_LABELS)[number]['key'];
type AssignmentConditions = Partial<TeamFormValues['assignmentConditions']>;

const DEFAULT_ASSIGNMENT_FIELD: AssignmentFieldKey = 'department';

function getInitialAssignmentFields(conditions: AssignmentConditions): AssignmentFieldKey[] {
  const populated = ASSIGNMENT_FIELD_LABELS
    .filter(({ key }) => (conditions?.[key]?.length ?? 0) > 0)
    .map(({ key }) => key);
  return populated.length ? populated : [DEFAULT_ASSIGNMENT_FIELD];
}

function buildAssignmentSummary(
  fields: AssignmentFieldKey[],
  conditions: AssignmentConditions,
): string {
  const parts = fields.flatMap((key) => {
    const definition = ASSIGNMENT_FIELD_LABELS.find((item) => item.key === key);
    const values = conditions?.[key] ?? [];
    return definition && values.length ? [`${definition.label.toLowerCase()} is ${values.join(' or ')}`] : [];
  });
  return parts.length
    ? `Employees whose ${parts.join(', and ')} will join automatically.`
    : 'Add a value to start assigning employees automatically.';
}

function ConditionValueInput({
  values,
  placeholder,
  canEdit,
  onChange,
}: {
  values: string[];
  placeholder: string;
  canEdit: boolean;
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const commitDraft = () => {
    const nextValue = draft.trim();
    if (!nextValue || values.some((value) => value.toLowerCase() === nextValue.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...values, nextValue]);
    setDraft('');
  };

  return (
    <div className="flex min-h-9 min-w-0 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1 focus-within:ring-2 focus-within:ring-ring">
      {values.map((value) => (
        <span key={value} className="inline-flex h-6 items-center gap-1 rounded bg-muted px-2 text-xs text-foreground">
          {value}
          {canEdit && (
            <button type="button" onClick={() => onChange(values.filter((item) => item !== value))} aria-label={`Remove ${value}`} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      <input
        value={draft}
        disabled={!canEdit}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            commitDraft();
          }
        }}
        placeholder={values.length ? 'Add value' : placeholder}
        className="h-6 min-w-[92px] flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

function AssignmentRuleRow({
  fieldKey,
  values,
  canEdit,
  onValuesChange,
  onRemove,
}: {
  fieldKey: AssignmentFieldKey;
  values: string[];
  canEdit: boolean;
  onValuesChange: (values: string[]) => void;
  onRemove: () => void;
}) {
  const definition = ASSIGNMENT_FIELD_LABELS.find((item) => item.key === fieldKey)!;
  const Icon = definition.icon;

  return (
    <div className="grid items-center gap-2 sm:grid-cols-[18px_180px_116px_minmax(180px,1fr)_32px]">
      <GripVertical className="hidden h-4 w-4 text-muted-foreground/70 sm:block" />
      <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-xs font-medium">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span>{definition.label}</span>
      </div>
      <div className="flex h-9 items-center rounded-md border border-input bg-background px-3 text-xs text-muted-foreground">is any of</div>
      <ConditionValueInput values={values} placeholder={`Add ${definition.label.toLowerCase()}`} canEdit={canEdit} onChange={onValuesChange} />
      <button type="button" disabled={!canEdit} onClick={onRemove} aria-label={`Remove ${definition.label} rule`} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function AssignmentConditionCard({
  form,
  canEdit = true,
}: {
  form: UseFormReturn<TeamFormValues>;
  canEdit?: boolean;
}) {
  const watchedMode = useWatch({
    control: form.control,
    name: 'assignmentMode',
    defaultValue: 'manual',
  });
  const assignmentMode = watchedMode || 'manual';

  const conditions = useWatch({
    control: form.control,
    name: 'assignmentConditions',
    defaultValue: EMPTY_TEAM_FORM_VALUES.assignmentConditions,
  }) as AssignmentConditions;
  const hasAssignmentError = !!form.formState.errors.assignmentConditions;
  const [activeFields, setActiveFields] = useState<AssignmentFieldKey[]>(() => getInitialAssignmentFields(conditions));
  const [fieldToAdd, setFieldToAdd] = useState<AssignmentFieldKey | ''>('');
  const availableFields = ASSIGNMENT_FIELD_LABELS.filter(({ key }) => !activeFields.includes(key));

  const updateCondition = (key: AssignmentFieldKey, values: string[]) => {
    form.setValue(`assignmentConditions.${key}`, values, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const removeRule = (key: AssignmentFieldKey) => {
    updateCondition(key, []);
    setActiveFields((current) => current.filter((item) => item !== key));
  };

  const addRule = () => {
    if (!fieldToAdd) return;
    setActiveFields((current) => [...current, fieldToAdd]);
    setFieldToAdd('');
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <FormLabel>Assignment Mode</FormLabel>
        <FormField
          control={form.control}
          name="assignmentMode"
          render={({ field }) => (
            <FormItem>
              <Select
                value={field.value || 'manual'}
                onValueChange={field.onChange}
                disabled={!canEdit}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignment mode" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>

      {assignmentMode === 'automatic' && (
        <div className="space-y-4 border-t pt-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                Assignment rules
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Members are added when they match these rules.</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <Filter className="h-3.5 w-3.5 text-primary" />
                <span className="h-3.5 w-3.5 rounded-full border-[4px] border-primary" />
                Match all rules (AND)
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground" title="The current assignment model combines different fields with AND">
                <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground" />
                Match any rule (OR)
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {activeFields.map((key) => (
              <AssignmentRuleRow
                key={key}
                fieldKey={key}
                values={conditions?.[key] ?? []}
                canEdit={canEdit}
                onValuesChange={(values) => updateCondition(key, values)}
                onRemove={() => removeRule(key)}
              />
            ))}
          </div>

          {canEdit && availableFields.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:pl-[26px]">
              <select
                value={fieldToAdd}
                onChange={(event) => setFieldToAdd(event.target.value as AssignmentFieldKey | '')}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
                aria-label="Choose assignment rule"
              >
                <option value="">Choose another criterion</option>
                {availableFields.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
              </select>
              <button type="button" disabled={!fieldToAdd} onClick={addRule} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-40">
                <Plus className="h-4 w-4" /> Add rule
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <UsersRound className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="truncate text-xs text-muted-foreground">{buildAssignmentSummary(activeFields, conditions)}</p>
            </div>
            <span className="shrink-0 text-xs font-medium text-primary">Updates when saved</span>
          </div>

          {hasAssignmentError && canEdit && (
            <p className="text-xs text-destructive">Add at least one value to an assignment rule.</p>
          )}
        </div>
      )}
      {assignmentMode !== 'automatic' && (
        <p className="text-sm text-muted-foreground">Automatic mode is disabled. Users will only be assigned manually.</p>
      )}
    </div>
  );
}

export function TeamFormFields({
  form,
  showActiveStatus = false,
}: {
  form: UseFormReturn<TeamFormValues>;
  showActiveStatus?: boolean;
}) {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Team Name</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter team name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea {...field} value={field.value ?? ''} placeholder="Enter team description" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="color"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Team Color</FormLabel>
            <FormControl>
              <Input
                value={field.value ?? '#3B82F6'}
                onChange={field.onChange}
                className="w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="assignmentMode"
        render={() => <></>}
      />

      <FormField
        control={form.control}
        name="assignmentConditions"
        render={() => (
          <FormItem>
            <FormMessage />
          </FormItem>
        )}
      />

      <AssignmentConditionCard form={form} />

      {showActiveStatus && (
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Enable or disable this team
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}
    </>
  );
}
