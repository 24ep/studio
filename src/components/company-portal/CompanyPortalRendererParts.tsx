"use client";

import * as React from 'react';
import { ArrowRight } from 'lucide-react';

import type { CompanyPortalBlock, CompanyPortalCmsCollection } from '@/lib/company-portal-builder';
import {
  resolveCompanyPortalButtonAction,
  resolveCompanyPortalItemClickAction,
} from '@/lib/company-portal-actions';
import { cn } from '@/lib/utils';

export function DataListItem({ block, editable, fields, record, spacing }: {
  block: CompanyPortalBlock;
  editable: boolean;
  fields: CompanyPortalCmsCollection['fields'];
  record: CompanyPortalCmsCollection['records'][number];
  spacing: 'compact' | 'comfortable' | 'spacious' | undefined;
}) {
  const action = resolveCompanyPortalItemClickAction(block, record);
  const className = cn(
    'grid gap-2 sm:grid-cols-[minmax(180px,1fr)_2fr]',
    getDataRowSpacing(spacing),
    action && !editable && 'group transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
  );
  const content = <>
    <p className="font-semibold">{record.values[fields[0].key] || '—'}</p>
    <p className="flex items-center justify-between gap-3 text-sm text-slate-600">
      <span>{fields.slice(1).map(field => record.values[field.key]).filter(Boolean).join(' · ') || 'No additional details'}</span>
      {action && !editable && <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1" />}
    </p>
  </>;

  return action && !editable ? (
    <a href={action.href} target={action.opensNewTab ? '_blank' : undefined} rel={action.opensNewTab ? 'noopener noreferrer' : undefined} className={className}>{content}</a>
  ) : <article className={className}>{content}</article>;
}

export function activateItemAction(action: { href: string; opensNewTab: boolean }) {
  if (action.opensNewTab) {
    window.open(action.href, '_blank', 'noopener,noreferrer');
    return;
  }
  window.location.assign(action.href);
}

export function DataComponentEmpty({ editable }: { editable: boolean }) {
  if (!editable) return null;
  return (
    <div className="mt-6 border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
      <p className="text-sm font-semibold text-slate-700">Connect a data module</p>
      <p className="mt-1 text-xs text-slate-500">Choose a model and the properties to display.</p>
    </div>
  );
}

export function getDataRowSpacing(spacing: 'compact' | 'comfortable' | 'spacious' | undefined) {
  if (spacing === 'compact') return 'py-2';
  if (spacing === 'spacious') return 'py-4';
  return 'py-3';
}

export function PortalButtonLink({
  block,
  children,
  className,
}: {
  block: CompanyPortalBlock;
  children: React.ReactNode;
  className: string;
}) {
  const action = resolveCompanyPortalButtonAction(block);

  return (
    <a
      href={action.href}
      className={className}
      target={action.opensNewTab ? '_blank' : undefined}
      rel={action.opensNewTab ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  );
}
