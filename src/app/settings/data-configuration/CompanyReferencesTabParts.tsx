"use client";

import { useEffect, useMemo, useState } from 'react';
import { Building2, DownloadCloud, Edit3, Image as ImageIcon, Loader2, PlusCircle, Trash2 } from 'lucide-react';

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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  SettingsEmptyState,
  SettingsLoadingState,
} from '@/components/settings/SettingsTabState';
import type { CompanyReference } from '@/lib/types';
import type { CompanyReferenceFormData } from './company-references-tab-api';

interface CompanyReferencesTabHeaderProps {
  appKitLoad?: {
    environment: 'development' | 'production';
    percent: number;
    message: string;
  } | null;
  onCreate: () => void;
  onLoadFromAppKit: (environment: 'development' | 'production') => void;
}

export function CompanyReferencesTabHeader({
  appKitLoad,
  onCreate,
  onLoadFromAppKit,
}: CompanyReferencesTabHeaderProps) {
  const loadingForDevelopment =
    appKitLoad && appKitLoad.environment === 'development' ? appKitLoad : null;
  const loadingForProduction =
    appKitLoad && appKitLoad.environment === 'production' ? appKitLoad : null;

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold">Company Reference Data</h2>
        <p className="text-sm text-muted-foreground">
          Manage common company names, logos, domains, and lookup details for Applicant and position pages.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!!appKitLoad}
          onClick={() => onLoadFromAppKit('development')}
          className="flex items-center gap-2"
        >
          {loadingForDevelopment ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
          {loadingForDevelopment
            ? `${loadingForDevelopment.percent}% · ${loadingForDevelopment.message}`
            : 'Load development references'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!!appKitLoad}
          onClick={() => onLoadFromAppKit('production')}
          className="flex items-center gap-2"
        >
          {loadingForProduction ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
          {loadingForProduction
            ? `${loadingForProduction.percent}% · ${loadingForProduction.message}`
            : 'Load live references'}
        </Button>
        <Button onClick={onCreate} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Company
        </Button>
      </div>
    </div>
  );
}

interface CompanyReferencesTabContentProps {
  companies: CompanyReference[];
  isLoading: boolean;
  onCreate: () => void;
  onEdit: (company: CompanyReference) => void;
  onDelete: (company: CompanyReference) => void;
}

export function CompanyReferencesTabContent({
  companies,
  isLoading,
  onCreate,
  onEdit,
  onDelete,
}: CompanyReferencesTabContentProps) {
  if (isLoading) {
    return <SettingsLoadingState label="Loading company references..." />;
  }

  if (companies.length === 0) {
    return (
      <SettingsEmptyState
        icon={Building2}
        title="No Company Reference Data"
        description="Create the first company reference to show company data on Applicant detail pages."
        action={(
          <Button onClick={onCreate}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create First Company
          </Button>
        )}
      />
    );
  }

  return (
    <div className="space-y-3">
      {companies.map((company) => (
        <Card key={company.id} className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <CompanyReferenceIdentity company={company} />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(company)} className="h-7 w-7">
                  <Edit3 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(company)}
                  className="h-7 w-7 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CompanyReferenceIdentity({ company }: { company: CompanyReference }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {company.logo ? (
        <img
          src={company.logo}
          alt={`${company.name} logo`}
          className="h-10 w-10 flex-shrink-0 rounded-md object-contain"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-muted">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-medium text-foreground">{company.name}</h3>
          {!company.isActive && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">Inactive</span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {[company.domain, company.industry, company.country].filter(Boolean).join(' / ') || company.description || 'No additional details'}
        </p>
      </div>
    </div>
  );
}

interface CompanyReferenceModalProps {
  open: boolean;
  company: CompanyReference | null;
  onClose: () => void;
  onSubmit: (data: CompanyReferenceFormData) => void;
}

export function CompanyReferenceModal({
  open,
  company,
  onClose,
  onSubmit,
}: CompanyReferenceModalProps) {
  const initialFormData = useMemo(() => getCompanyReferenceFormDefaults(company), [company]);
  const [formData, setFormData] = useState<CompanyReferenceFormData>(initialFormData);

  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData, open]);

  const updateField = <K extends keyof CompanyReferenceFormData>(
    key: K,
    value: CompanyReferenceFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    onSubmit({
      ...formData,
      name: formData.name.trim(),
      sortOrder: Number.isFinite(Number(formData.sortOrder)) ? Number(formData.sortOrder) : 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>{company ? 'Edit Company Reference' : 'Add Company Reference'}</DialogTitle>
          <DialogDescription>
            Store common company details used for Applicant and position lookup displays.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CompanyReferenceField label="Company Name" value={formData.name} onChange={(value) => updateField('name', value)} required />
          <CompanyReferenceField label="Legal Name" value={formData.legalName || ''} onChange={(value) => updateField('legalName', value)} />
          <CompanyReferenceField label="Logo URL" value={formData.logo || ''} onChange={(value) => updateField('logo', value)} />
          <CompanyReferenceField label="Website" value={formData.website || ''} onChange={(value) => updateField('website', value)} />
          <CompanyReferenceField label="Domain" value={formData.domain || ''} onChange={(value) => updateField('domain', value)} />
          <CompanyReferenceField label="Industry" value={formData.industry || ''} onChange={(value) => updateField('industry', value)} />
          <CompanyReferenceField label="Email" value={formData.email || ''} onChange={(value) => updateField('email', value)} />
          <CompanyReferenceField label="Phone" value={formData.phone || ''} onChange={(value) => updateField('phone', value)} />
          <CompanyReferenceField label="Country" value={formData.country || ''} onChange={(value) => updateField('country', value)} />
          <CompanyReferenceField label="Sort Order" type="number" value={String(formData.sortOrder)} onChange={(value) => updateField('sortOrder', Number(value))} />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company-address">Address</Label>
            <Textarea id="company-address" value={formData.address || ''} onChange={(event) => updateField('address', event.target.value)} rows={2} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company-description">Description</Label>
            <Textarea id="company-description" value={formData.description || ''} onChange={(event) => updateField('description', event.target.value)} rows={3} />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Switch checked={formData.isActive} onCheckedChange={(checked) => updateField('isActive', checked)} />
            <Label>Active</Label>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={handleSubmit} disabled={!formData.name.trim()}>
            {company ? 'Save Company' : 'Create Company'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CompanyReferenceField({
  label,
  value,
  onChange,
  required = false,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  const id = `company-reference-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function CompanyReferenceDeleteDialog({
  company,
  onCancel,
  onConfirm,
}: {
  company: CompanyReference | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!company) return null;

  return (
    <AlertDialog open={!!company} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Company Reference</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{company.name}"? Applicant and position records will keep their IDs, but this lookup display will be removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function getCompanyReferenceFormDefaults(company: CompanyReference | null): CompanyReferenceFormData {
  return {
    name: company?.name || '',
    legalName: company?.legalName || '',
    logo: company?.logo || '',
    website: company?.website || '',
    domain: company?.domain || '',
    industry: company?.industry || '',
    description: company?.description || '',
    email: company?.email || '',
    phone: company?.phone || '',
    address: company?.address || '',
    country: company?.country || '',
    sortOrder: company?.sortOrder || 0,
    isActive: company?.isActive ?? true,
  };
}
