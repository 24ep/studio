"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { Database, Loader2, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { sortRowsByColumn, type SortDirection } from '@/components/ui/sortable-table';
import type { CustomFieldDefinition } from '@/lib/types';
import { hasAnyPermission } from '@/lib/permissions';
import { readJsonOrFallback } from '@/lib/response-json';
import { OPEN_FIELD_CREATION_EVENT } from './field-management-events';
import {
  buildFieldRowsSortValueResolvers,
  EMPTY_FIELD_FORM,
  FieldManagementFieldForm,
  FieldManagementModelSidebar,
  FieldManagementTable,
  optionsToText,
  parseOptions,
  type FieldFormState,
  type FieldManagementRow,
  type PlatformDataModel,
} from './FieldManagementParts';

interface FieldManagementResponse {
  models: PlatformDataModel[];
  message?: string;
}

export default function FieldManagementPage() {
  const { data: session, status } = useSession();
  const canManageFields = hasAnyPermission(session?.user, ['CUSTOM_FIELDS_EDIT']);
  const [models, setModels] = useState<PlatformDataModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeModelName, setActiveModelName] = useState<string>('');
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [form, setForm] = useState<FieldFormState>(EMPTY_FIELD_FORM);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const pendingCreateFormRef = useRef(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  useEffect(() => {
    setIsEmbedded(new URLSearchParams(window.location.search).get('adminCenterEmbed') === '1');
  }, []);

  const loadModels = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/field-management');
      const data = await readJsonOrFallback<FieldManagementResponse>(response, { models: [] });
      if (!response.ok) throw new Error(data.message || 'Failed to load field management data');
      setModels(data.models);
      setActiveModelName(current => current || data.models[0]?.name || '');
    } catch (error) {
      console.error('Failed to load field management data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load field management data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn(undefined, { callbackUrl: '/settings/field-management' });
      return;
    }

    if (status === 'authenticated') void loadModels();
  }, [loadModels, status]);

  const filteredModels = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return models;

    return models.filter(model =>
      model.name.toLowerCase().includes(needle)
      || model.label.toLowerCase().includes(needle)
      || model.fields.some(field => field.name.toLowerCase().includes(needle))
      || model.customFields.some(field => field.label.toLowerCase().includes(needle) || field.field_code.toLowerCase().includes(needle))
    );
  }, [models, query]);

  const activeModel = models.find(model => model.name === activeModelName) || filteredModels[0] || models[0];
  const customFieldMap = useMemo(
    () => new Map(activeModel?.customFields.map(field => [field.field_code, field]) || []),
    [activeModel?.customFields],
  );
  const fieldRowsSortValueResolvers = useMemo(
    () => buildFieldRowsSortValueResolvers(customFieldMap),
    [customFieldMap],
  );
  const fieldRows = useMemo<FieldManagementRow[]>(() => [
    ...(activeModel?.fields || []).map(field => ({ kind: 'system' as const, field })),
    ...(activeModel?.customFields || []).map(field => ({ kind: 'custom' as const, field })),
  ], [activeModel]);
  const sortedFieldRows = useMemo(
    () => sortRowsByColumn(fieldRows, sortColumn, sortDirection, fieldRowsSortValueResolvers),
    [fieldRows, sortColumn, sortDirection, fieldRowsSortValueResolvers],
  );

  const handleSort = (column: string | null, direction: SortDirection) => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const openCreateForm = useCallback(() => {
    if (!activeModel) {
      pendingCreateFormRef.current = true;
      return;
    }

    pendingCreateFormRef.current = false;
    setEditingField(null);
    setForm({
      ...EMPTY_FIELD_FORM,
      model_name: activeModel.name,
      sort_order: activeModel.customFields.length,
    });
  }, [activeModel]);

  useEffect(() => {
    if (activeModel && pendingCreateFormRef.current) openCreateForm();
  }, [activeModel, openCreateForm]);

  useEffect(() => {
    const handleAdminCenterAction = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin
        || event.source !== window.parent
        || event.data?.type !== OPEN_FIELD_CREATION_EVENT
      ) return;

      openCreateForm();
    };

    window.addEventListener('message', handleAdminCenterAction);
    return () => window.removeEventListener('message', handleAdminCenterAction);
  }, [openCreateForm]);

  const openEditForm = (field: CustomFieldDefinition) => {
    setEditingField(field);
    setForm({
      allowCustomOptions: field.allowCustomOptions || false,
      field_code: field.field_code,
      field_type: field.field_type,
      is_required: field.is_required || false,
      label: field.label,
      model_name: field.model_name,
      optionsText: optionsToText(field.options || []),
      sort_order: field.sort_order || 0,
    });
  };

  const closeForm = () => {
    setEditingField(null);
    setForm(EMPTY_FIELD_FORM);
  };

  const saveField = async () => {
    if (!form.model_name || !form.field_code || !form.label) {
      toast.error('Model, field code, and label are required.');
      return;
    }

    if (!/^[A-Z0-9_]+$/.test(form.field_code)) {
      toast.error('Field code must be uppercase alphanumeric with underscores.');
      return;
    }

    try {
      const payload = {
        model_name: form.model_name,
        field_code: form.field_code,
        label: form.label,
        field_type: form.field_type,
        viewRoles: [],
        editRoles: [],
        showInFilter: false,
        showInApplicantDetail: false,
        showInFullApplicantDetail: false,
        showInTaskBoardFilter: false,
        showInPositionSettings: false,
        showInHeadcountDetail: false,
        is_required: form.is_required,
        allowCustomOptions: form.allowCustomOptions,
        sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
        options: parseOptions(form.optionsText),
      };
      const response = await fetch(
        editingField ? `/api/settings/custom-field-definitions/${editingField.id}` : '/api/settings/custom-field-definitions',
        {
          method: editingField ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const result = await readJsonOrFallback<{ message?: string }>(response, {});
      if (!response.ok) throw new Error(result.message || `Failed to ${editingField ? 'update' : 'create'} field`);

      toast.success(`Field ${editingField ? 'updated' : 'created'} successfully.`);
      closeForm();
      await loadModels();
    } catch (error) {
      console.error('Failed to save field:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save field');
    }
  };

  const deleteField = async (field: CustomFieldDefinition) => {
    if (!confirm(`Delete "${field.label}" from ${field.model_name}?`)) return;

    try {
      const response = await fetch(`/api/settings/custom-field-definitions/${field.id}`, { method: 'DELETE' });
      const result = await readJsonOrFallback<{ message?: string }>(response, {});
      if (!response.ok) throw new Error(result.message || 'Failed to delete field');
      toast.success('Field deleted successfully.');
      await loadModels();
    } catch (error) {
      console.error('Failed to delete field:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete field');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!canManageFields) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-md rounded-md border bg-card p-6 text-center">
          <Database className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="mt-3 text-lg font-semibold">Field Management</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You need CUSTOM_FIELDS_EDIT permission to manage platform fields.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col p-6">
      {!isEmbedded && (
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-normal text-foreground">Field Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse every platform data model. System fields are locked; dynamic fields can be added, updated, or deleted.
            </p>
          </div>
          <Button onClick={openCreateForm} disabled={!activeModel}>
            <Plus className="mr-2 h-4 w-4" />
            Add Field
          </Button>
        </header>
      )}

      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <FieldManagementModelSidebar
          activeModelName={activeModel?.name}
          models={filteredModels}
          query={query}
          onQueryChange={setQuery}
          onSelectModel={setActiveModelName}
        />

        <main className="min-h-0 overflow-hidden rounded-md border bg-card">
          {activeModel && (
            <>
              <div className="flex items-start justify-between gap-4 border-b p-4">
                <div>
                  <h2 className="text-lg font-semibold">{activeModel.label}</h2>
                  <p className="text-sm text-muted-foreground">
                    {activeModel.fields.length} system fields, {activeModel.customFields.length} dynamic fields
                  </p>
                </div>
                <span className="rounded border px-2 py-1 text-xs font-medium text-muted-foreground">{activeModel.name}</span>
              </div>

              {form.model_name && (
                <FieldManagementFieldForm
                  editingField={editingField}
                  form={form}
                  models={models}
                  onClose={closeForm}
                  onFormChange={setForm}
                  onSave={saveField}
                />
              )}

              <FieldManagementTable
                customFieldMap={customFieldMap}
                rows={sortedFieldRows}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onDeleteField={deleteField}
                onEditField={openEditForm}
                onSort={handleSort}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
