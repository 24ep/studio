"use client";

import * as React from 'react';
import { Clock3, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import type {
  CompanyPortalCmsCollection,
  CompanyPortalCmsFieldType,
} from '@/lib/company-portal-builder';

export function CompanyPortalCmsDataTab({
  draft,
  recordValues,
  setRecordValues,
  onAddRecord,
  onRemoveRecord,
}: {
  draft: CompanyPortalCmsCollection;
  recordValues: Record<string, string>;
  setRecordValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onAddRecord: () => void;
  onRemoveRecord: (recordId: string) => void;
}) {
  return (
    <TabsContent value="data" className="min-h-0 flex-1 overflow-y-auto p-5">
      {draft.sourceType === 'platform' ? (
        <EmptyState title="Live application data" description={`Records come from the ${draft.sourceModel || 'selected'} application model and are controlled by the configured filter conditions.`} />
      ) : draft.fields.length === 0 ? (
        <EmptyState title="Fields required" description="Create collection fields before adding CMS records." />
      ) : (
        <>
          <div className="grid gap-3 rounded-[6px] border bg-muted/50 p-3 sm:grid-cols-2">
            {draft.fields.map(field => (
              <Field key={field.id} label={`${field.name}${field.required ? ' *' : ''}`}>
                <Input
                  type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                  value={recordValues[field.key] || ''}
                  onChange={event => setRecordValues(current => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))}
                />
              </Field>
            ))}
            <div className="flex items-end sm:col-span-2">
              <Button type="button" onClick={onAddRecord}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add record
              </Button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-[6px] border">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  {draft.fields.map(field => <th key={field.id} className="px-3 py-2 font-medium">{field.name}</th>)}
                  <th className="w-12 px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {draft.records.map(record => (
                  <tr key={record.id}>
                    {draft.fields.map(field => (
                      <td key={field.id} className="max-w-[220px] truncate px-3 py-2.5">
                        {record.values[field.key] || '-'}
                      </td>
                    ))}
                    <td className="px-2 py-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => onRemoveRecord(record.id)}
                        aria-label="Delete CMS record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {draft.records.length === 0 && (
              <p className="border-t px-3 py-8 text-center text-xs text-muted-foreground">No CMS records yet.</p>
            )}
          </div>
        </>
      )}
    </TabsContent>
  );
}

export function CompanyPortalCmsActivityTab({ activity }: { activity: CompanyPortalCmsCollection['activity'] }) {
  return (
    <TabsContent value="activity" className="min-h-0 flex-1 overflow-y-auto p-5">
      <div className="divide-y rounded-[6px] border">
        {activity.length === 0 && (
          <EmptyState title="No activity yet" description="Collection changes will be recorded here." />
        )}
        {activity.map(item => (
          <div key={item.id} className="flex gap-3 px-3 py-3">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{item.action}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </TabsContent>
  );
}

export function mapPlatformFieldType(type: string): CompanyPortalCmsFieldType {
  if (['Int', 'Float', 'Decimal', 'BigInt'].includes(type)) return 'number';
  if (type === 'Boolean') return 'boolean';
  if (type === 'DateTime') return 'date';
  return 'text';
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

export function EmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="px-4 py-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
