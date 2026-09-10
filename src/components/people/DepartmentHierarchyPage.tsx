"use client";

import * as React from 'react';
import { Building2, Download, FolderTree, Layers3, Plus, Search, Upload, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OrganizationUnitType } from '@/lib/hr/organization-hierarchy';
import { hasPermission } from '@/lib/permissions';
import { DepartmentHierarchyDialogs } from './DepartmentHierarchyDialogs';
import { DepartmentHierarchyTree } from './DepartmentHierarchyTree';
import { DepartmentUnitDrawer } from './DepartmentUnitDrawer';
import {
  buildDepartmentHierarchy,
  filterDepartmentUnits,
  getDepartmentHierarchyStats,
  normalizeDepartmentUnit,
  type DepartmentUnit,
} from './department-hierarchy-utils';
import {
  capitalizeDepartmentUnit,
  EMPTY_DEPARTMENT_FORM,
  getDepartmentParentType,
  type DepartmentFormState,
} from './department-hierarchy-form-model';

interface DepartmentApiResponse {
  code?: string;
  data?: { id: string; code?: string | null };
  resource?: {
    records?: Array<Record<string, unknown> & { id: string }>;
  };
  message?: string;
}

export function DepartmentHierarchyPage() {
  const { data: session } = useSession();
  const canManage = hasPermission(session?.user, 'HR_PEOPLE_MANAGE');
  const [units, setUnits] = React.useState<DepartmentUnit[]>([]);
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = React.useState(true);
  const [choiceOpen, setChoiceOpen] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [showNewParent, setShowNewParent] = React.useState(false);
  const [editingUnit, setEditingUnit] = React.useState<DepartmentUnit | null>(null);
  const [archiveUnit, setArchiveUnit] = React.useState<DepartmentUnit | null>(null);
  const [form, setForm] = React.useState<DepartmentFormState>(EMPTY_DEPARTMENT_FORM);
  const [codePreview, setCodePreview] = React.useState('');
  const [newDivisionCodePreview, setNewDivisionCodePreview] = React.useState('');
  const [isCodePreviewLoading, setIsCodePreviewLoading] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [selectedUnit, setSelectedUnit] = React.useState<DepartmentUnit | null>(null);

  const loadUnits = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/hr/departments', {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await response.json() as DepartmentApiResponse;
      if (!response.ok) throw new Error(data.message || 'Failed to load organization structure');
      setUnits((data.resource?.records || []).map(normalizeDepartmentUnit));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load organization structure');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadUnits();
  }, [loadUnits]);

  const filteredUnits = React.useMemo(
    () => filterDepartmentUnits(units, query, status),
    [query, status, units],
  );
  const hierarchy = React.useMemo(() => buildDepartmentHierarchy(filteredUnits), [filteredUnits]);
  const stats = React.useMemo(() => getDepartmentHierarchyStats(units), [units]);
  const validParents = React.useMemo(() => {
    const requiredType = getDepartmentParentType(form.unitType);
    return requiredType
      ? units.filter(unit => unit.unitType === requiredType && unit.isActive)
      : [];
  }, [form.unitType, units]);

  React.useEffect(() => {
    if (!formOpen) return;
    if (editingUnit) {
      setCodePreview(editingUnit.code);
      setNewDivisionCodePreview('');
      return;
    }

    const controller = new AbortController();
    const loadPreview = async () => {
      const requiresParent = form.unitType !== 'division';
      const createsNewDivision = form.unitType === 'department' && showNewParent;
      if (requiresParent && !form.parentId && !createsNewDivision) {
        setCodePreview('');
        setNewDivisionCodePreview('');
        return;
      }

      setIsCodePreviewLoading(true);
      try {
        if (createsNewDivision) {
          const divisionCode = await fetchCodePreview('division', null, controller.signal);
          setNewDivisionCodePreview(divisionCode);
          setCodePreview(`${divisionCode}-DEP-001`);
          return;
        }

        const nextCode = await fetchCodePreview(
          form.unitType,
          form.parentId || null,
          controller.signal,
        );
        setCodePreview(nextCode);
        setNewDivisionCodePreview('');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setCodePreview('');
          toast.error(error instanceof Error ? error.message : 'Failed to generate organization code');
        }
      } finally {
        if (!controller.signal.aborted) setIsCodePreviewLoading(false);
      }
    };

    void loadPreview();
    return () => controller.abort();
  }, [editingUnit, form.parentId, form.unitType, formOpen, showNewParent]);

  const openCreate = (seed?: Partial<DepartmentUnit>) => {
    if (!seed?.unitType) {
      setChoiceOpen(true);
      return;
    }
    setEditingUnit(null);
    setShowNewParent(false);
    setForm({
      ...EMPTY_DEPARTMENT_FORM,
      unitType: seed.unitType,
      parentId: seed.parentId || '',
    });
    setFormOpen(true);
  };

  const chooseType = (unitType: OrganizationUnitType) => {
    setChoiceOpen(false);
    openCreate({ unitType, parentId: null });
  };

  const openEdit = (unit: DepartmentUnit) => {
    setEditingUnit(unit);
    setShowNewParent(false);
    setForm({
      name: unit.name,
      code: unit.code,
      unitType: unit.unitType,
      parentId: unit.parentId || '',
      description: unit.description,
      headcountAllocation: unit.headcountAllocation === null ? '' : String(unit.headcountAllocation),
      isActive: unit.isActive,
      newParentName: '',
    });
    setFormOpen(true);
  };

  const updateForm = (key: keyof DepartmentFormState, value: string | boolean) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const saveUnit = async () => {
    if (!form.name.trim()) {
      toast.error('Unit name is required.');
      return;
    }
    if (!editingUnit && form.unitType !== 'division' && !form.parentId && !showNewParent) {
      toast.error(`Select a ${getDepartmentParentType(form.unitType)}.`);
      return;
    }
    if (showNewParent && !form.newParentName.trim()) {
      toast.error('New division name is required.');
      return;
    }
    if (form.headcountAllocation !== '' && (
      !Number.isInteger(Number(form.headcountAllocation)) || Number(form.headcountAllocation) < 0
    )) {
      toast.error('Headcount allocation must be a non-negative whole number.');
      return;
    }

    setIsSaving(true);
    try {
      let parentId = form.parentId || null;
      if (!editingUnit && form.unitType === 'department' && showNewParent) {
        const parentResponse = await fetch('/api/hr/departments/hierarchy', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.newParentName.trim(),
            code: null,
            unitType: 'division',
            parentId: null,
            isActive: true,
          }),
        });
        const parentData = await parentResponse.json() as DepartmentApiResponse;
        if (!parentResponse.ok || !parentData.data?.id) {
          throw new Error(parentData.message || 'Failed to create division');
        }
        parentId = parentData.data.id;
      }

      const response = await fetch('/api/hr/departments/hierarchy', {
        method: editingUnit ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUnit ? {
          action: 'update',
          id: editingUnit.id,
          name: form.name.trim(),
          description: form.description.trim() || null,
          headcountAllocation: form.headcountAllocation === '' ? null : Number(form.headcountAllocation),
          isActive: form.isActive,
        } : {
          name: form.name.trim(),
          code: null,
          unitType: form.unitType,
          parentId,
          description: form.description.trim() || null,
          headcountAllocation: form.headcountAllocation === '' ? null : Number(form.headcountAllocation),
          isActive: form.isActive,
        }),
      });
      const data = await response.json() as DepartmentApiResponse;
      if (!response.ok) throw new Error(data.message || 'Failed to save organization unit');

      setFormOpen(false);
      toast.success(editingUnit
        ? 'Organization unit updated.'
        : `${capitalizeDepartmentUnit(form.unitType)} ${data.data?.code || codePreview} created.`);
      await loadUnits();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save organization unit');
    } finally {
      setIsSaving(false);
    }
  };

  const moveUnit = async (id: string, parentId: string | null, index: number) => {
    try {
      const response = await fetch('/api/hr/departments/hierarchy', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move', id, parentId, index }),
      });
      const data = await response.json() as DepartmentApiResponse;
      if (!response.ok) throw new Error(data.message || 'Failed to move organization unit');
      toast.success('Organization structure updated.');
      await loadUnits();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to move organization unit');
    }
  };

  const importStructure = async () => {
    if (!importFile) {
      toast.error('Choose a CSV file.');
      return;
    }
    setIsSaving(true);
    try {
      const body = new FormData();
      body.append('file', importFile);
      const response = await fetch('/api/hr/departments/transfer', {
        method: 'POST',
        credentials: 'include',
        body,
      });
      const data = await response.json() as DepartmentApiResponse;
      if (!response.ok) throw new Error(data.message || 'Failed to import organization structure');
      setImportOpen(false);
      setImportFile(null);
      toast.success(data.message || 'Organization structure imported.');
      await loadUnits();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import organization structure');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmArchive = async () => {
    if (!archiveUnit) return;
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/hr/departments?id=${encodeURIComponent(archiveUnit.id)}`,
        { method: 'DELETE', credentials: 'include' },
      );
      const data = await response.json() as DepartmentApiResponse;
      if (!response.ok) throw new Error(data.message || 'Failed to archive organization unit');
      setArchiveUnit(null);
      toast.success('Organization unit archived.');
      await loadUnits();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to archive organization unit');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-full px-4 py-4 sm:px-6">
      <div className="grid grid-cols-2 border border-b-0 md:grid-cols-4">
        <Metric icon={Building2} label="Divisions" value={stats.divisions} />
        <Metric icon={FolderTree} label="Departments" value={stats.departments} />
        <Metric icon={Layers3} label="Sections" value={stats.sections} />
        <Metric icon={Users} label="Employees" value={stats.employees} />
      </div>

      <section className="border bg-background">
        <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search organization..."
                className="pl-8"
              />
            </div>
            <Select value={status} onValueChange={value => setStatus(value as typeof status)}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {canManage && (
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button type="button" variant="outline" asChild>
                <a href="/api/hr/departments/transfer?mode=export">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </a>
              </Button>
              <Button type="button" onClick={() => openCreate()}>
                <Plus className="mr-2 h-4 w-4" />
                Add unit
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2 border-t p-4">
            {[1, 2, 3, 4].map(item => <div key={item} className="h-10 animate-pulse bg-muted" />)}
          </div>
        ) : (
          <DepartmentHierarchyTree
            canManage={canManage}
            hierarchy={hierarchy}
            onArchive={setArchiveUnit}
            onCreate={openCreate}
            onEdit={openEdit}
            onMove={moveUnit}
            onSelect={setSelectedUnit}
          />
        )}
      </section>

      <DepartmentUnitDrawer
        unit={selectedUnit}
        units={units}
        onOpenChange={open => !open && setSelectedUnit(null)}
      />

      <DepartmentHierarchyDialogs
        choiceOpen={choiceOpen}
        formOpen={formOpen}
        importOpen={importOpen}
        editingUnit={editingUnit}
        archiveUnit={archiveUnit}
        form={form}
        validParents={validParents}
        showNewParent={showNewParent}
        codePreview={codePreview}
        newDivisionCodePreview={newDivisionCodePreview}
        isCodePreviewLoading={isCodePreviewLoading}
        isSaving={isSaving}
        importFile={importFile}
        onChoiceOpenChange={setChoiceOpen}
        onChooseType={chooseType}
        onFormOpenChange={setFormOpen}
        onUpdateForm={updateForm}
        onToggleNewParent={() => {
          setShowNewParent(current => !current);
          updateForm('parentId', '');
        }}
        onSave={saveUnit}
        onImportOpenChange={setImportOpen}
        onImportFileChange={setImportFile}
        onImport={importStructure}
        onArchiveOpenChange={open => {
          if (!open) setArchiveUnit(null);
        }}
        onArchive={confirmArchive}
      />
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-r p-3 last:border-r-0 md:border-b-0">
      <Icon className="h-4 w-4 text-primary" />
      <div>
        <p className="text-lg font-semibold leading-none">{value}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

async function fetchCodePreview(
  unitType: OrganizationUnitType,
  parentId: string | null,
  signal: AbortSignal,
) {
  const query = new URLSearchParams({ unitType });
  if (parentId) query.set('parentId', parentId);
  const response = await fetch(`/api/hr/departments/hierarchy?${query}`, {
    credentials: 'include',
    cache: 'no-store',
    signal,
  });
  const data = await response.json() as DepartmentApiResponse;
  if (!response.ok || !data.code) {
    throw new Error(data.message || 'Failed to generate organization code');
  }
  return data.code;
}
