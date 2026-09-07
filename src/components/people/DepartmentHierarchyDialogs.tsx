"use client";

import * as React from 'react';
import { Building2, FileDown, FolderTree, Layers3, Loader2, Plus, Upload, Users } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { OrganizationUnitType } from '@/lib/hr/organization-hierarchy';
import type { DepartmentUnit } from './department-hierarchy-utils';
import {
  capitalizeDepartmentUnit,
  getDepartmentParentType,
  type DepartmentFormState,
} from './department-hierarchy-form-model';

const UNIT_TYPE_DETAILS: Array<{
  type: OrganizationUnitType;
  label: string;
  description: string;
  icon: typeof Building2;
}> = [
  { type: 'division', label: 'Division', description: 'Top-level business area or enterprise group.', icon: Building2 },
  { type: 'department', label: 'Department', description: 'Functional team within an existing division.', icon: FolderTree },
  { type: 'section', label: 'Section', description: 'Specialized group within a department.', icon: Layers3 },
  { type: 'unit', label: 'Unit', description: 'Operational team within a section.', icon: Users },
];

interface DepartmentHierarchyDialogsProps {
  choiceOpen: boolean;
  formOpen: boolean;
  importOpen: boolean;
  editingUnit: DepartmentUnit | null;
  archiveUnit: DepartmentUnit | null;
  form: DepartmentFormState;
  validParents: DepartmentUnit[];
  showNewParent: boolean;
  codePreview: string;
  newDivisionCodePreview: string;
  isCodePreviewLoading: boolean;
  isSaving: boolean;
  importFile: File | null;
  onChoiceOpenChange: (open: boolean) => void;
  onChooseType: (unitType: OrganizationUnitType) => void;
  onFormOpenChange: (open: boolean) => void;
  onUpdateForm: (key: keyof DepartmentFormState, value: string | boolean) => void;
  onToggleNewParent: () => void;
  onSave: () => void;
  onImportOpenChange: (open: boolean) => void;
  onImportFileChange: (file: File | null) => void;
  onImport: () => void;
  onArchiveOpenChange: (open: boolean) => void;
  onArchive: () => void;
}

export function DepartmentHierarchyDialogs({
  choiceOpen,
  formOpen,
  importOpen,
  editingUnit,
  archiveUnit,
  form,
  validParents,
  showNewParent,
  codePreview,
  newDivisionCodePreview,
  isCodePreviewLoading,
  isSaving,
  importFile,
  onChoiceOpenChange,
  onChooseType,
  onFormOpenChange,
  onUpdateForm,
  onToggleNewParent,
  onSave,
  onImportOpenChange,
  onImportFileChange,
  onImport,
  onArchiveOpenChange,
  onArchive,
}: DepartmentHierarchyDialogsProps) {
  const organizationUnitFormFields = (
    <div className="grid gap-4 py-2 sm:grid-cols-2">
      {!editingUnit && form.unitType !== 'division' && (
        <div className="sm:col-span-2">
          <FormField label={`${capitalizeDepartmentUnit(getDepartmentParentType(form.unitType) || 'parent')} code`}>
            <div className="flex gap-2">
              <Select
                value={form.parentId}
                onValueChange={value => {
                  onUpdateForm('parentId', value);
                }}
                disabled={showNewParent}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={`Select ${getDepartmentParentType(form.unitType)} code`} />
                </SelectTrigger>
                <SelectContent>
                  {validParents.map(parent => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.code || 'No code'} - {parent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.unitType === 'department' && (
                <Button type="button" variant="outline" onClick={onToggleNewParent}>
                  <Plus className="mr-2 h-4 w-4" />
                  New division
                </Button>
              )}
            </div>
          </FormField>
        </div>
      )}
      {!editingUnit && form.unitType === 'department' && showNewParent && (
        <>
          <FormField label="New division name">
            <Input value={form.newParentName} onChange={event => onUpdateForm('newParentName', event.target.value)} />
          </FormField>
          <FormField label="New division code">
            <AutoGeneratedCodeField
              code={newDivisionCodePreview}
              isLoading={isCodePreviewLoading}
              placeholder="Generating division code..."
            />
          </FormField>
        </>
      )}
      <FormField label={`${capitalizeDepartmentUnit(form.unitType)} name`}>
        <Input value={form.name} onChange={event => onUpdateForm('name', event.target.value)} />
      </FormField>
      <FormField label={editingUnit ? 'Code' : 'Auto-generated code'}>
        {editingUnit ? (
          <div className="space-y-1.5">
            <Input value={form.code} readOnly className="bg-muted/40 font-mono" />
            <p className="text-[11px] text-muted-foreground">Organization codes stay fixed after creation.</p>
          </div>
        ) : (
          <AutoGeneratedCodeField
            code={codePreview}
            isLoading={isCodePreviewLoading}
            placeholder={form.unitType === 'division'
              ? 'Generating division code...'
              : `Select ${getDepartmentParentType(form.unitType)} to generate code`}
          />
        )}
      </FormField>
      <FormField label="Status">
        <Select
          value={form.isActive ? 'active' : 'inactive'}
          onValueChange={value => onUpdateForm('isActive', value === 'active')}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Headcount allocation">
        <div className="space-y-1.5">
          <Input
            type="number"
            min={0}
            step={1}
            value={form.headcountAllocation}
            onChange={event => onUpdateForm('headcountAllocation', event.target.value)}
            placeholder="Unlimited"
          />
          <p className="text-[11px] text-muted-foreground">Blank is unlimited. Usage includes all child units.</p>
        </div>
      </FormField>
      <div className="sm:col-span-2">
        <FormField label="Description">
          <Textarea value={form.description} onChange={event => onUpdateForm('description', event.target.value)} rows={4} />
        </FormField>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={choiceOpen} onOpenChange={onChoiceOpenChange}>
        <DialogContent className="sm:max-w-[640px]" dialogId="organization-unit-type">
          <DialogHeader>
            <DialogTitle>Add organization unit</DialogTitle>
            <DialogDescription>Choose the hierarchy level to create.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2 sm:grid-cols-2">
            {UNIT_TYPE_DETAILS.map(option => (
              <button
                key={option.type}
                type="button"
                onClick={() => onChooseType(option.type)}
                className="flex min-h-28 items-start gap-3 rounded-md border bg-background p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <option.icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span>
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen && !editingUnit} onOpenChange={onFormOpenChange}>
        <DialogContent className="sm:max-w-[620px]" dialogId="organization-unit-form">
          <DialogHeader>
            <DialogTitle>{`Add ${form.unitType}`}</DialogTitle>
            <DialogDescription>Add the unit to the correct place in the hierarchy.</DialogDescription>
          </DialogHeader>
          {organizationUnitFormFields}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onFormOpenChange(false)}>Cancel</Button>
            <Button type="button" onClick={onSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : `Create ${form.unitType}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={formOpen && Boolean(editingUnit)} onOpenChange={onFormOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col overflow-y-auto p-0 sm:max-w-xl" sheetId="organization-unit-edit">
          <SheetHeader className="border-b bg-muted/20 px-5 py-5 pr-14 text-left">
            <div className="mb-1 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
                <Building2 className="h-4 w-4" />
              </span>
              <Badge variant="outline" className="capitalize">{form.unitType}</Badge>
            </div>
            <SheetTitle>Edit {form.unitType}</SheetTitle>
            <SheetDescription>
              Update the editable attributes below. Drag the item in the tree to change its parent or hierarchy level.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 px-5 py-4">{organizationUnitFormFields}</div>
          <SheetFooter className="sticky bottom-0 border-t bg-background px-5 py-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onFormOpenChange(false)}>Cancel</Button>
            <Button type="button" onClick={onSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={importOpen} onOpenChange={onImportOpenChange}>
        <DialogContent className="sm:max-w-[560px]" dialogId="organization-import">
          <DialogHeader>
            <DialogTitle>Import organization structure</DialogTitle>
            <DialogDescription>
              Upload a CSV with typed units and parent codes. Import rows are validated before any changes are applied.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between gap-3 border p-3">
              <div>
                <p className="text-sm font-medium">CSV template</p>
                <p className="text-xs text-muted-foreground">Includes division, department, section, and unit examples.</p>
              </div>
              <Button type="button" variant="outline" size="sm" asChild>
                <a href="/api/hr/departments/transfer?mode=template">
                  <FileDown className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            </div>
            <FormField label="CSV file">
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={event => onImportFileChange(event.target.files?.[0] || null)}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onImportOpenChange(false)}>Cancel</Button>
            <Button type="button" onClick={onImport} disabled={isSaving || !importFile}>
              <Upload className="mr-2 h-4 w-4" />
              {isSaving ? 'Importing...' : 'Import structure'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(archiveUnit)} onOpenChange={onArchiveOpenChange}>
        <AlertDialogContent dialogId="archive-organization-unit">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {archiveUnit?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The unit will remain in history but will no longer be active in HR workflows.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onArchive} disabled={isSaving}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function AutoGeneratedCodeField({ code, isLoading, placeholder }: { code: string; isLoading: boolean; placeholder: string }) {
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Input
          value={code}
          readOnly
          placeholder={placeholder}
          className="bg-muted/40 pr-9 font-mono"
          aria-label="Auto-generated organization code"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Uses the selected parent code, unit prefix, and next running number.
      </p>
    </div>
  );
}

function FormField({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
