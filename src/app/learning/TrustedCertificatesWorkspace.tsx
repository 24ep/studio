"use client";

import Image from 'next/image';
import * as React from 'react';
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

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
import { cn } from '@/lib/utils';

type TrustedRecord = Record<string, unknown> & { id: string };
type WorkspaceView = 'issuers' | 'registry';

type TrustPolicyMetadata = {
  category: string;
  renewalRequirement: string;
  credentialIdPattern: string;
  geographicCoverage: string;
  policyOwner: string;
  nextReviewAt: string;
  approvedOn: string;
  verificationRequirements: string[];
  policyChangeNote: string;
};

type Credential = {
  id: string;
  name: string;
  issuer: string;
  validityMonths: number | null;
  verificationUrl: string;
  status: string;
  verifiedAt: string;
  createdAt: string;
  category: string;
  policy: TrustPolicyMetadata;
  record: TrustedRecord;
};

type IssuerGroup = {
  name: string;
  credentials: Credential[];
  category: string;
  status: string;
  verificationUrl: string;
  verifiedAt: string;
};

const issuerLogos: Record<string, string> = {
  'american red cross': '/learning/trusted-certificates/american-red-cross.png',
  'amazon web services': '/learning/trusted-certificates/amazon-web-services.png',
  aws: '/learning/trusted-certificates/amazon-web-services.png',
  'project management institute': '/learning/trusted-certificates/project-management-institute.png',
  pmi: '/learning/trusted-certificates/project-management-institute.png',
  peoplecert: '/learning/trusted-certificates/peoplecert.png',
  comptia: '/learning/trusted-certificates/comptia.png',
  'national registry of food safety professionals': '/learning/trusted-certificates/nrfsp.png',
};

const issuerCategories: Record<string, string> = {
  'american red cross': 'Health & Safety',
  'amazon web services': 'Technology & Cloud',
  'project management institute': 'Professional Services',
  peoplecert: 'Digital Credentials',
  comptia: 'IT & Certification',
  'national registry of food safety professionals': 'Food Safety',
};

const issuerCategoryOrder = ['Health & Safety', 'Technology & Cloud', 'Professional Services', 'Digital Credentials', 'IT & Certification', 'Food Safety'];

function value(record: TrustedRecord, camel: string, snake?: string) {
  return record[camel] ?? (snake ? record[snake] : undefined);
}

function stringValue(input: unknown, fallback = '') {
  if (typeof input === 'string' && input.trim()) return input.trim();
  if (typeof input === 'number') return String(input);
  return fallback;
}

function policyMetadata(record: TrustedRecord): TrustPolicyMetadata {
  const raw = value(record, 'policyMetadata', 'policy_metadata');
  let parsed: Record<string, unknown> = {};
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) parsed = raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    try { parsed = JSON.parse(raw) as Record<string, unknown>; } catch { parsed = {}; }
  }
  return {
    category: stringValue(parsed.category),
    renewalRequirement: stringValue(parsed.renewalRequirement, 'required'),
    credentialIdPattern: stringValue(parsed.credentialIdPattern),
    geographicCoverage: stringValue(parsed.geographicCoverage, 'Global'),
    policyOwner: stringValue(parsed.policyOwner, 'Learning & Development'),
    nextReviewAt: stringValue(parsed.nextReviewAt),
    approvedOn: stringValue(parsed.approvedOn),
    verificationRequirements: Array.isArray(parsed.verificationRequirements) ? parsed.verificationRequirements.map(item => stringValue(item)).filter(Boolean) : [],
    policyChangeNote: stringValue(parsed.policyChangeNote),
  };
}

function normalizeStatus(input: unknown) {
  return stringValue(input, 'active').toLowerCase().replaceAll('_', ' ');
}

function categoryFor(name: string) {
  const candidate = name.toLowerCase();
  if (/aws|cloud|itil|security|comptia|technology/.test(candidate)) return 'Technology & Cloud';
  if (/first aid|cpr|safety/.test(candidate)) return 'Health & Safety';
  if (/pmp|project|leadership|management/.test(candidate)) return 'Professional Services';
  if (/food|forklift|operator|compliance/.test(candidate)) return 'Compliance';
  return 'Professional Credentials';
}

function credentialPriority(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes('cloud practitioner')) return 0;
  if (normalized.includes('solutions architect') && normalized.includes('associate')) return 1;
  if (normalized.includes('solutions architect') && normalized.includes('professional')) return 2;
  if (normalized.includes('developer')) return 3;
  if (normalized.includes('security')) return 4;
  return 10;
}

function formatDate(input: unknown) {
  const raw = stringValue(input);
  if (!raw) return 'Not reviewed';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function nextReviewDate(input: string) {
  if (!input) return '';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + 90);
  return date.toISOString();
}

function validityLabel(months: number | null) {
  if (!months) return 'No expiry';
  if (months % 12 === 0) return `${months / 12} ${months === 12 ? 'year' : 'years'}`;
  return `${months} months`;
}

function renewalLabel(value: string) {
  if (value === 'not_required') return 'Not required';
  if (value === 'varies') return 'Varies by credential';
  return 'Required';
}

function statusTone(status: string) {
  if (/review|pending/.test(status)) return 'bg-amber-500/15 text-amber-500';
  if (/archive|expired|reject/.test(status)) return 'bg-rose-500/15 text-rose-500';
  return 'bg-lime-500/15 text-lime-500';
}

function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <span className={cn('inline-flex rounded px-2 py-1 text-[11px] font-semibold capitalize', statusTone(status))}>{label || status}</span>;
}

function IssuerMark({ issuer, size = 'md' }: { issuer: string; size?: 'sm' | 'md' | 'lg' }) {
  const logo = issuerLogos[issuer.toLowerCase()];
  const dimension = size === 'lg' ? 68 : size === 'sm' ? 34 : 54;
  if (logo) return <Image src={logo} alt="" width={dimension} height={dimension} unoptimized className="shrink-0 rounded-full object-cover" />;
  const initials = issuer.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase();
  return <span style={{ width: dimension, height: dimension }} className="grid shrink-0 place-items-center rounded-full border border-[#cbd3de] bg-[#edf2f8] text-xs font-bold text-[#516079] dark:border-[#33445a] dark:bg-[#162236] dark:text-zinc-200">{initials || 'TC'}</span>;
}

export function TrustedCertificatesWorkspace({
  certificates,
  isSaving,
  onAdd,
  onUpdate,
  onDelete,
}: {
  certificates: TrustedRecord[];
  isSaving: boolean;
  onAdd: (options?: { mode?: 'issuer' | 'credential'; issuer?: string }) => void;
  onUpdate: (id: string, patch: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const credentials = React.useMemo<Credential[]>(() => certificates
    .filter(item => stringValue(value(item, 'recordType', 'record_type')).toLowerCase() === 'trusted')
    .map(item => {
      const name = stringValue(item.name, 'Untitled credential');
      const months = Number(value(item, 'validityMonths', 'validity_months'));
      const policy = policyMetadata(item);
      return {
        id: item.id,
        name,
        issuer: stringValue(item.issuer, 'Issuer not recorded'),
        validityMonths: Number.isFinite(months) && months > 0 ? months : null,
        verificationUrl: stringValue(value(item, 'verificationUrl', 'verification_url')),
        status: normalizeStatus(item.status),
        verifiedAt: stringValue(value(item, 'verifiedAt', 'verified_at')),
        createdAt: stringValue(value(item, 'createdAt', 'created_at')),
        category: policy.category || categoryFor(name),
        policy,
        record: item,
      };
    }), [certificates]);

  const issuers = React.useMemo<IssuerGroup[]>(() => {
    const groups = new Map<string, Credential[]>();
    credentials.forEach(credential => groups.set(credential.issuer, [...(groups.get(credential.issuer) || []), credential]));
    return [...groups.entries()].map(([name, items]) => ({
      name,
      credentials: [...items].sort((a, b) => credentialPriority(a.name) - credentialPriority(b.name) || a.name.localeCompare(b.name)),
      category: issuerCategories[name.toLowerCase()] || categoryFor(`${name} ${items.map(item => item.name).join(' ')}`),
      status: items.some(item => /review|pending/.test(item.status)) ? 'review due' : items.every(item => /archive|expired/.test(item.status)) ? 'archived' : 'trusted',
      verificationUrl: items.find(item => item.verificationUrl)?.verificationUrl || '',
      verifiedAt: items.map(item => item.verifiedAt).filter(Boolean).sort().at(-1) || '',
    })).sort((a, b) => {
      const aRank = issuerCategoryOrder.indexOf(a.category);
      const bRank = issuerCategoryOrder.indexOf(b.category);
      return (aRank < 0 ? 99 : aRank) - (bRank < 0 ? 99 : bRank) || a.name.localeCompare(b.name);
    });
  }, [credentials]);

  const [workspaceView, setWorkspaceView] = React.useState<WorkspaceView>('issuers');
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('all');
  const [coverage, setCoverage] = React.useState('all');
  const [selectedIssuerName, setSelectedIssuerName] = React.useState('');
  const [selectedCredentialId, setSelectedCredentialId] = React.useState('');
  const [registryTab, setRegistryTab] = React.useState<'active' | 'review' | 'archived'>('active');
  const [editOpen, setEditOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState({ name: '', issuer: '', validityMonths: '', verificationUrl: '', status: 'active', category: '', renewalRequirement: 'required', credentialIdPattern: '', geographicCoverage: 'Global', policyOwner: 'Learning & Development', approvedOn: '', nextReviewAt: '', verificationRequirements: '', policyChangeNote: '' });

  const categories = React.useMemo(() => [...new Set(issuers.map(issuer => issuer.category))], [issuers]);
  const filteredIssuers = issuers.filter(issuer => {
    const search = query.toLowerCase();
    const matchesQuery = `${issuer.name} ${issuer.credentials.map(item => item.name).join(' ')}`.toLowerCase().includes(search);
    const matchesCategory = category === 'all' || issuer.category === category;
    const matchesCoverage = coverage === 'all' || (coverage === 'verified' ? Boolean(issuer.verificationUrl) : !issuer.verificationUrl);
    return matchesQuery && matchesCategory && matchesCoverage;
  });
  const selectedIssuer = filteredIssuers.find(item => item.name === selectedIssuerName)
    || filteredIssuers.find(item => item.name.toLowerCase() === 'amazon web services')
    || filteredIssuers[0]
    || null;
  const selectedCredential = credentials.find(item => item.id === selectedCredentialId)
    || selectedIssuer?.credentials[0]
    || credentials[0]
    || null;

  const openEditor = (credential: Credential | null) => {
    if (!credential) return;
    setEditForm({
      name: credential.name,
      issuer: credential.issuer === 'Issuer not recorded' ? '' : credential.issuer,
      validityMonths: credential.validityMonths ? String(credential.validityMonths) : '',
      verificationUrl: credential.verificationUrl,
      status: credential.status,
      category: credential.policy.category || credential.category,
      renewalRequirement: credential.policy.renewalRequirement,
      credentialIdPattern: credential.policy.credentialIdPattern,
      geographicCoverage: credential.policy.geographicCoverage,
      policyOwner: credential.policy.policyOwner,
      approvedOn: (credential.policy.approvedOn || credential.verifiedAt).slice(0, 10),
      nextReviewAt: credential.policy.nextReviewAt ? credential.policy.nextReviewAt.slice(0, 10) : '',
      verificationRequirements: credential.policy.verificationRequirements.join('\n'),
      policyChangeNote: credential.policy.policyChangeNote,
    });
    setSelectedCredentialId(credential.id);
    setEditOpen(true);
  };

  const savePolicy = async () => {
    if (!selectedCredential || !editForm.name.trim()) return;
    await onUpdate(selectedCredential.id, {
      name: editForm.name.trim(),
      issuer: editForm.issuer.trim(),
      validityMonths: editForm.validityMonths ? Number(editForm.validityMonths) : null,
      verificationUrl: editForm.verificationUrl.trim() || null,
      status: editForm.status,
      verifiedAt: editForm.approvedOn || null,
      policyMetadata: {
        category: editForm.category.trim(),
        renewalRequirement: editForm.renewalRequirement,
        credentialIdPattern: editForm.credentialIdPattern.trim(),
        geographicCoverage: editForm.geographicCoverage.trim() || 'Global',
        policyOwner: editForm.policyOwner.trim(),
        nextReviewAt: editForm.nextReviewAt || null,
        approvedOn: editForm.approvedOn || null,
        verificationRequirements: editForm.verificationRequirements.split('\n').map(item => item.trim()).filter(Boolean),
        policyChangeNote: editForm.policyChangeNote.trim(),
      },
    });
    setEditOpen(false);
  };

  const archivePolicy = async (credential: Credential | null) => {
    if (!credential || !window.confirm(`Archive “${credential.name}”?`)) return;
    await onUpdate(credential.id, { status: 'archived' });
  };

  const exportRegistry = () => {
    const rows = [['Credential', 'Category', 'Trusted issuer', 'Validity', 'Verification URL', 'Status'], ...credentials.map(item => [item.name, item.category, item.issuer, validityLabel(item.validityMonths), item.verificationUrl, item.status])];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `trusted-certificates-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const reviewDue = React.useMemo(() => credentials.filter(item => {
    if (/review|pending/.test(item.status)) return true;
    if (!item.policy.nextReviewAt) return false;
    const reviewAt = new Date(item.policy.nextReviewAt).getTime();
    return Number.isFinite(reviewAt) && reviewAt <= Date.now();
  }), [credentials]);

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-[#f8fafc] px-4 pb-10 pt-6 font-sans text-[#172033] dark:bg-[#09111d] dark:text-zinc-50 sm:px-7 lg:px-8">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[2rem] font-bold leading-tight tracking-[-.04em]">Trusted certificates</h1>
          <p className="mt-1.5 text-[15px] text-[#6f7886] dark:text-zinc-300">{workspaceView === 'issuers' ? 'Manage trusted issuers and the credentials your organization accepts.' : 'Define the credentials your organization recognizes and how they should be verified.'}</p>
          {workspaceView === 'registry' && <p className="mt-1 text-sm text-[#6f7886] dark:text-zinc-400">Date anchor: {formatDate(new Date().toISOString())}</p>}
        </div>
        <Button type="button" onClick={() => onAdd({ mode: workspaceView === 'issuers' ? 'issuer' : 'credential', issuer: workspaceView === 'issuers' ? undefined : selectedIssuer?.name })} className="h-11 bg-[#316be8] px-4 font-semibold hover:bg-[#285dce]"><PlusIcon className="mr-2 h-4 w-4" />{workspaceView === 'issuers' ? 'Add trusted issuer' : 'Add trusted certificate'}</Button>
      </header>

      {workspaceView === 'registry' && <div className="mt-7 flex flex-wrap items-stretch gap-y-4 text-sm">
        <div className="flex min-w-[215px] items-center gap-3 border-r border-[#334157] pr-8"><ShieldCheckIcon className="h-6 w-6" /><p><span className="block text-base font-bold">{credentials.length}</span><span className="text-[#6f7886] dark:text-zinc-300">Recognized credentials</span></p></div>
        <div className="flex min-w-[195px] items-center gap-3 border-r border-[#334157] px-8"><UserGroupIcon className="h-6 w-6" /><p><span className="block text-base font-bold">{issuers.length}</span><span className="text-[#6f7886] dark:text-zinc-300">Trusted issuers</span></p></div>
        <div className="flex min-w-[210px] items-center gap-3 px-8"><ExclamationTriangleIcon className="h-6 w-6" /><p><span className="block text-base font-bold">{reviewDue.length}</span><span className="text-[#6f7886] dark:text-zinc-300">Policies needing review</span></p></div>
      </div>}

      {workspaceView === 'issuers' && <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative w-full sm:max-w-[286px]"><MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#788598]" /><span className="sr-only">Search trusted certificates</span><Input value={query} onChange={event => setQuery(event.target.value)} placeholder={workspaceView === 'issuers' ? 'Search issuers' : 'Search credentials or issuers'} className="h-10 border-[#aeb9c7] bg-transparent pl-9 shadow-none dark:border-[#415069]" /></label>
        <label className="relative"><FunnelIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#788598]" /><span className="sr-only">Filter by category</span><select value={category} onChange={event => setCategory(event.target.value)} className="h-10 min-w-44 appearance-none rounded-md border border-[#aeb9c7] bg-transparent pl-9 pr-8 text-sm font-semibold dark:border-[#415069]"><option value="all">All categories</option>{categories.map(item => <option key={item}>{item}</option>)}</select></label>
        <label><span className="sr-only">Filter by verification coverage</span><select value={coverage} onChange={event => setCoverage(event.target.value)} className="h-10 min-w-40 rounded-md border border-[#aeb9c7] bg-transparent px-3 text-sm font-semibold dark:border-[#415069]"><option value="all">All coverage</option><option value="verified">Verification source</option><option value="missing">Source missing</option></select></label>
        <Button type="button" variant="outline" onClick={() => setWorkspaceView('registry')} className="h-10 border-[#607089] bg-transparent text-[#316be8] sm:ml-auto dark:border-[#415069]">Switch to credential registry <ChevronRightIcon className="ml-1.5 h-4 w-4" /></Button>
      </div>}

      {!credentials.length ? <EmptyTrustedCertificates onAdd={onAdd} /> : workspaceView === 'issuers' ? (
        <IssuerNetwork
          issuers={filteredIssuers}
          selectedIssuer={selectedIssuer}
          selectedCredential={selectedCredential}
          onSelectIssuer={name => { setSelectedIssuerName(name); setSelectedCredentialId(''); }}
          onSelectCredential={setSelectedCredentialId}
          onAdd={() => onAdd({ mode: 'credential', issuer: selectedIssuer?.name })}
          onEdit={() => openEditor(selectedCredential)}
          reviewDueIds={new Set(reviewDue.map(item => item.id))}
          onShowReview={() => { setWorkspaceView('registry'); setRegistryTab('review'); }}
        />
      ) : (
        <CredentialRegistry
          credentials={credentials}
          query={query}
          category={category}
          tab={registryTab}
          selected={credentials.find(item => item.id === selectedCredentialId) || credentials.find(item => item.name.toLowerCase().includes('pmp')) || credentials[0] || null}
          categories={categories}
          onQueryChange={setQuery}
          onCategoryChange={setCategory}
          onSwitchView={() => setWorkspaceView('issuers')}
          onTabChange={setRegistryTab}
          onSelect={setSelectedCredentialId}
          onEdit={openEditor}
          onArchive={credential => void archivePolicy(credential)}
          onExport={exportRegistry}
          reviewDueIds={new Set(reviewDue.map(item => item.id))}
        />
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>Edit trust policy</DialogTitle><DialogDescription>Update the credential definition, issuer, validity, and official verification source.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="trusted-name">Credential</Label><Input id="trusted-name" value={editForm.name} onChange={event => setEditForm(current => ({ ...current, name: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="trusted-issuer">Issuer</Label><Input id="trusted-issuer" value={editForm.issuer} onChange={event => setEditForm(current => ({ ...current, issuer: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="trusted-category">Category</Label><Input id="trusted-category" value={editForm.category} onChange={event => setEditForm(current => ({ ...current, category: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="trusted-validity">Standard validity (months)</Label><Input id="trusted-validity" type="number" min="1" value={editForm.validityMonths} onChange={event => setEditForm(current => ({ ...current, validityMonths: event.target.value }))} placeholder="No expiry" /></div>
            <div className="space-y-2"><Label htmlFor="trusted-renewal">Renewal requirement</Label><select id="trusted-renewal" value={editForm.renewalRequirement} onChange={event => setEditForm(current => ({ ...current, renewalRequirement: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="required">Required</option><option value="not_required">Not required</option><option value="varies">Varies by credential</option></select></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="trusted-url">Official verification URL</Label><Input id="trusted-url" type="url" value={editForm.verificationUrl} onChange={event => setEditForm(current => ({ ...current, verificationUrl: event.target.value }))} placeholder="https://issuer.example/verify" /></div>
            <div className="space-y-2"><Label htmlFor="trusted-pattern">Credential ID pattern</Label><Input id="trusted-pattern" value={editForm.credentialIdPattern} onChange={event => setEditForm(current => ({ ...current, credentialIdPattern: event.target.value }))} placeholder="PMP-\\d{6,10}" /></div>
            <div className="space-y-2"><Label htmlFor="trusted-coverage">Geographic coverage</Label><Input id="trusted-coverage" value={editForm.geographicCoverage} onChange={event => setEditForm(current => ({ ...current, geographicCoverage: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="trusted-owner">Policy owner</Label><Input id="trusted-owner" value={editForm.policyOwner} onChange={event => setEditForm(current => ({ ...current, policyOwner: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="trusted-status">Status</Label><select id="trusted-status" value={editForm.status} onChange={event => setEditForm(current => ({ ...current, status: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="active">Active</option><option value="pending">Review due</option><option value="archived">Archived</option></select></div>
            <div className="space-y-2"><Label htmlFor="trusted-approved">Approved on</Label><Input id="trusted-approved" type="date" value={editForm.approvedOn} onChange={event => setEditForm(current => ({ ...current, approvedOn: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="trusted-review">Next policy review</Label><Input id="trusted-review" type="date" value={editForm.nextReviewAt} onChange={event => setEditForm(current => ({ ...current, nextReviewAt: event.target.value }))} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="trusted-requirements">Verification requirements (one per line)</Label><textarea id="trusted-requirements" value={editForm.verificationRequirements} onChange={event => setEditForm(current => ({ ...current, verificationRequirements: event.target.value }))} className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="trusted-change-note">Policy change note</Label><textarea id="trusted-change-note" value={editForm.policyChangeNote} onChange={event => setEditForm(current => ({ ...current, policyChangeNote: event.target.value }))} className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
          </div>
          <DialogFooter className="sm:justify-between"><Button type="button" variant="outline" disabled={isSaving || !selectedCredential} onClick={() => { if (!selectedCredential || !window.confirm(`Permanently delete “${selectedCredential.name}”? This cannot be undone.`)) return; void onDelete(selectedCredential.id).then(() => setEditOpen(false)).catch(() => undefined); }} className="border-rose-500/50 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"><TrashIcon className="mr-2 h-4 w-4" />Delete permanently</Button><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button type="button" disabled={isSaving || !editForm.name.trim()} onClick={() => void savePolicy()}>{isSaving ? 'Saving…' : 'Save policy'}</Button></div></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IssuerNetwork({ issuers, selectedIssuer, selectedCredential, reviewDueIds, onSelectIssuer, onSelectCredential, onAdd, onEdit, onShowReview }: {
  issuers: IssuerGroup[];
  selectedIssuer: IssuerGroup | null;
  selectedCredential: Credential | null;
  reviewDueIds: Set<string>;
  onSelectIssuer: (name: string) => void;
  onSelectCredential: (id: string) => void;
  onAdd: () => void;
  onEdit: () => void;
  onShowReview: () => void;
}) {
  if (!issuers.length) return <div className="mt-5 border-y border-[#cbd3de] py-16 text-center dark:border-[#314056]"><p className="font-semibold">No issuers match these filters.</p><p className="mt-1 text-sm text-[#6f7c90]">Try another search or category.</p></div>;
  return <section className="mt-5 grid overflow-hidden rounded-[8px] border border-[#cbd3de] bg-white dark:border-[#314056] dark:bg-[#101a28] lg:grid-cols-[368px_minmax(0,1fr)]">
    <aside className="border-b border-[#d5dce5] lg:border-b-0 lg:border-r dark:border-[#314056]">
      <div className="flex items-center justify-between border-b border-[#d5dce5] px-4 py-4 dark:border-[#314056]"><h2 className="text-sm font-bold">All issuers</h2><span className="rounded-full bg-[#e8edf4] px-2 py-0.5 text-xs font-semibold dark:bg-[#1d2a3d]">{issuers.length}</span></div>
      <div>{issuers.map((issuer, index) => <React.Fragment key={issuer.name}>{(index === 0 || issuers[index - 1]?.category !== issuer.category) && <div className="border-b border-[#d9dfe7] bg-[#f4f7fb] px-4 py-1.5 text-xs font-semibold text-[#738095] dark:border-[#29374a] dark:bg-[#0d1725] dark:text-zinc-400">{issuer.category}</div>}<button type="button" onClick={() => onSelectIssuer(issuer.name)} className={cn('flex w-full items-center gap-3 border-b border-[#d9dfe7] px-4 py-3 text-left transition hover:bg-[#f3f7fd] dark:border-[#29374a] dark:hover:bg-[#152338]', issuer.name === selectedIssuer?.name && 'bg-[#eaf2ff] shadow-[inset_3px_0_0_#316be8] dark:bg-[#142744]')}>
        <IssuerMark issuer={issuer.name} />
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{issuer.name}</span><span className="mt-0.5 block text-xs text-[#6f7c90] dark:text-zinc-400">{issuer.credentials.length} {issuer.credentials.length === 1 ? 'credential' : 'credentials'} · Global</span></span>
        <StatusBadge status={issuer.status} />
      </button></React.Fragment>)}</div>
    </aside>
    {selectedIssuer && <div className="min-w-0">
      <div className="flex flex-col gap-4 border-b border-[#d5dce5] p-4 dark:border-[#314056] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4"><IssuerMark issuer={selectedIssuer.name} size="lg" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">{selectedIssuer.name}</h2><StatusBadge status={selectedIssuer.status} label={selectedIssuer.status === 'trusted' ? 'Trusted issuer' : undefined} /></div>{selectedIssuer.verificationUrl ? <a href={selectedIssuer.verificationUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-sm text-[#316be8] hover:underline">{selectedIssuer.verificationUrl.replace(/\/$/, '')} <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 shrink-0" /></a> : <p className="mt-1 text-sm text-amber-500">Verification source not configured</p>}<p className="mt-1 text-xs text-[#6f7c90] dark:text-zinc-400">Last reviewed: {formatDate(selectedIssuer.verifiedAt)}</p></div></div>
        <div className="flex flex-wrap gap-2"><Button type="button" onClick={onEdit} className="bg-[#316be8] hover:bg-[#285dce]"><PencilSquareIcon className="mr-2 h-4 w-4" />Edit issuer policy</Button>{selectedIssuer.verificationUrl && <Button asChild variant="outline" className="border-[#93a0b2] bg-transparent"><a href={selectedIssuer.verificationUrl} target="_blank" rel="noreferrer">Open verification portal <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4" /></a></Button>}</div>
      </div>
      <div className="grid min-h-[520px] xl:grid-cols-[minmax(0,1fr)_292px]">
        <div className="min-w-0 border-b border-[#d5dce5] xl:border-b-0 xl:border-r dark:border-[#314056]"><h3 className="px-4 py-4 text-sm font-bold">Accepted credentials</h3><div className="overflow-x-auto"><table className="w-full min-w-[530px] text-left text-[13px]"><thead className="border-y border-[#d5dce5] text-[11px] text-[#69778b] dark:border-[#314056] dark:text-zinc-400"><tr><th className="px-4 py-3 font-medium">Credential</th><th className="px-2.5 py-3 font-medium">Level</th><th className="px-2.5 py-3 font-medium">Standard validity</th><th className="px-2.5 py-3 font-medium">Verification</th><th className="px-2.5 py-3 font-medium">Status</th></tr></thead><tbody className="divide-y divide-[#d9dfe7] dark:divide-[#29374a]">{selectedIssuer.credentials.map(credential => <tr key={credential.id} onClick={() => onSelectCredential(credential.id)} className="cursor-pointer hover:bg-[#f3f7fd] dark:hover:bg-[#152338]"><td className="px-4 py-3"><div className="flex items-center gap-2"><IssuerMark issuer={selectedIssuer.name} size="sm" /><span className="font-semibold">{credential.name}</span></div></td><td className="px-2.5 py-3 text-[#5f6d82] dark:text-zinc-300">{credential.name.includes('Professional') ? 'Professional' : credential.name.includes('Associate') ? 'Associate' : 'Standard'}</td><td className="whitespace-nowrap px-2.5 py-3">{validityLabel(credential.validityMonths)}</td><td className="whitespace-nowrap px-2.5 py-3">{credential.verificationUrl ? (selectedIssuer.name === 'Amazon Web Services' ? 'AWS Verify' : 'Official portal') : 'Manual review'}</td><td className="px-2.5 py-3"><span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs"><CheckCircleIcon className="h-4 w-4 text-lime-500" />Accepted</span></td></tr>)}</tbody></table></div><button type="button" onClick={onAdd} className="m-4 flex w-[calc(100%-2rem)] items-center gap-2 rounded-[6px] border border-dashed border-[#8aa1bd] px-4 py-3 text-sm font-semibold text-[#316be8] hover:bg-[#f3f7fd] dark:border-[#415069] dark:hover:bg-[#152338]"><PlusIcon className="h-4 w-4" />Add credential to issuer</button></div>
        <aside className="p-5"><h3 className="text-sm font-bold">Trust coverage</h3><dl className="mt-4 space-y-4 text-sm"><div className="border-b border-[#d5dce5] pb-4 dark:border-[#314056]"><dt className="font-semibold">Regions</dt><dd className="mt-1 text-[#6f7c90] dark:text-zinc-400">{selectedCredential?.policy.geographicCoverage || 'Global'}</dd></div><div className="border-b border-[#d5dce5] pb-4 dark:border-[#314056]"><dt className="font-semibold">Accepted evidence types</dt><dd className="mt-1 leading-6 text-[#6f7c90] dark:text-zinc-400">Digital certificate, transcript, badge, verification link</dd></div><div className="border-b border-[#d5dce5] pb-4 dark:border-[#314056]"><dt className="font-semibold">Verification endpoint</dt><dd className="mt-1 flex items-center gap-2 text-[#6f7c90] dark:text-zinc-400">{selectedIssuer.verificationUrl ? <><CheckCircleIcon className="h-4 w-4 text-lime-500" />Operational</> : <><ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />Not configured</>}</dd></div><div className="border-b border-[#d5dce5] pb-4 dark:border-[#314056]"><dt className="font-semibold">Policy owner</dt><dd className="mt-2 flex items-center gap-2"><Image src="/learning/certificates/maya-chen-avatar.png" alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" /><span><span className="block font-medium">{selectedCredential?.policy.policyOwner || 'Learning & Development'}</span><span className="block text-xs text-[#6f7c90]">Policy administration</span></span></dd></div><div><dt className="font-semibold">Next review date</dt><dd className="mt-1 flex items-center gap-2 text-[#6f7c90] dark:text-zinc-400"><CalendarDaysIcon className="h-4 w-4" />{selectedIssuer.status === 'review due' ? 'Action required' : formatDate(selectedCredential?.policy.nextReviewAt || nextReviewDate(selectedIssuer.verifiedAt))}</dd></div></dl><button type="button" className="mt-5 flex w-full items-center justify-between rounded-[6px] border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-left text-xs font-semibold text-amber-600 dark:text-amber-400"><span className="flex items-center gap-2"><ExclamationTriangleIcon className="h-4 w-4" />{Math.min(2, selectedIssuer.credentials.length)} credential mappings need review</span><ChevronRightIcon className="h-4 w-4" /></button><div className="mt-5 border-t border-[#d5dce5] pt-5 dark:border-[#314056]"><h4 className="text-sm font-bold">Recent changes</h4><div className="mt-3 space-y-3">{selectedIssuer.credentials.slice(0, 3).map(credential => <div key={credential.id} className="flex gap-2.5 text-xs"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#316be8]" /><p><span className="block font-semibold">{credential.policy.policyChangeNote || `Added ${credential.name}`}</span><span className="mt-0.5 block text-[#6f7c90]">{formatDate(credential.createdAt || credential.verifiedAt)}</span></p></div>)}</div><button type="button" className="mt-4 text-xs font-semibold text-[#316be8] hover:underline">View full change log</button></div></aside>
      </div>
    </div>}
  </section>;
}

function CredentialRegistry({ credentials, query, category, categories, tab, selected, reviewDueIds, onQueryChange, onCategoryChange, onSwitchView, onTabChange, onSelect, onEdit, onArchive, onExport }: {
  credentials: Credential[]; query: string; category: string; tab: 'active' | 'review' | 'archived'; selected: Credential | null;
  categories: string[]; onQueryChange: (query: string) => void; onCategoryChange: (category: string) => void; onSwitchView: () => void;
  reviewDueIds: Set<string>;
  onTabChange: (tab: 'active' | 'review' | 'archived') => void; onSelect: (id: string) => void; onEdit: (credential: Credential) => void; onArchive: (credential: Credential) => void; onExport: () => void;
}) {
  const rows = credentials.filter(item => `${item.name} ${item.issuer}`.toLowerCase().includes(query.toLowerCase()))
    .filter(item => category === 'all' || item.category === category)
    .filter(item => tab === 'active' ? !reviewDueIds.has(item.id) && !/archive|expired/.test(item.status) : tab === 'review' ? reviewDueIds.has(item.id) : /archive|expired/.test(item.status));
  const current = rows.find(item => item.id === selected?.id) || rows[0] || null;
  return <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(380px,1fr)]">
    <section className="min-w-0 overflow-hidden rounded-[8px] border border-[#cbd3de] bg-white dark:border-[#314056] dark:bg-[#101a28]"><div className="flex flex-wrap items-center gap-3 border-b border-[#d5dce5] p-4 dark:border-[#314056]"><label className="relative min-w-[260px] flex-1"><MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#788598]" /><span className="sr-only">Search credentials</span><Input value={query} onChange={event => onQueryChange(event.target.value)} placeholder="Search credentials, issuers, or categories" className="h-10 border-[#aeb9c7] bg-transparent pl-9 shadow-none dark:border-[#415069]" /></label><label className="relative"><FunnelIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#788598]" /><span className="sr-only">Filter by status</span><select value={tab} onChange={event => onTabChange(event.target.value as 'active' | 'review' | 'archived')} className="h-10 min-w-36 appearance-none rounded-md border border-[#aeb9c7] bg-transparent pl-9 pr-8 text-sm font-semibold dark:border-[#415069]"><option value="active">All status</option><option value="review">Review due</option><option value="archived">Archived</option></select></label><label className="relative"><FunnelIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#788598]" /><span className="sr-only">Filter by category</span><select value={category} onChange={event => onCategoryChange(event.target.value)} className="h-10 min-w-40 appearance-none rounded-md border border-[#aeb9c7] bg-transparent pl-9 pr-8 text-sm font-semibold dark:border-[#415069]"><option value="all">All categories</option>{categories.map(item => <option key={item}>{item}</option>)}</select></label><Button type="button" variant="ghost" onClick={onExport}><ArrowDownTrayIcon className="mr-2 h-4 w-4" />Export</Button></div><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d5dce5] px-4 dark:border-[#314056]"><nav className="flex gap-8">{(['active', 'review', 'archived'] as const).map(item => <button key={item} type="button" onClick={() => onTabChange(item)} className={cn('relative py-4 text-sm font-medium capitalize text-[#69778b]', tab === item && 'font-semibold text-[#172033] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#316be8] dark:text-white')}>{item === 'review' ? 'Review due' : item}</button>)}</nav><Button type="button" variant="outline" onClick={onSwitchView} className="h-9 border-[#607089] bg-transparent text-xs text-[#316be8] dark:border-[#415069]">Switch to issuer view <ChevronRightIcon className="ml-1 h-4 w-4" /></Button></div>{rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-[#d5dce5] text-xs text-[#69778b] dark:border-[#314056]"><tr><th className="px-4 py-3 font-medium">Credential</th><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Trusted issuer</th><th className="px-4 py-3 font-medium">Validity</th><th className="px-4 py-3 font-medium">Verification</th><th className="px-4 py-3 font-medium">Status</th></tr></thead><tbody className="divide-y divide-[#d9dfe7] dark:divide-[#29374a]">{rows.map(item => <tr key={item.id} onClick={() => onSelect(item.id)} className={cn('cursor-pointer hover:bg-[#f3f7fd] dark:hover:bg-[#152338]', current?.id === item.id && 'bg-[#eaf2ff] shadow-[inset_3px_0_0_#316be8] dark:bg-[#142744]')}><td className="px-4 py-4 font-semibold">{item.name}</td><td className="px-4 py-4">{item.category}</td><td className="px-4 py-4">{item.issuer}</td><td className="px-4 py-4">{validityLabel(item.validityMonths)}</td><td className="px-4 py-4">{item.verificationUrl ? 'Official portal' : 'Manual review'}</td><td className="px-4 py-4"><StatusBadge status={item.status} /></td></tr>)}</tbody></table></div> : <div className="px-6 py-16 text-center text-sm text-[#6f7c90]">No policies in this view.</div>}</section>
    {current && <aside className="h-fit overflow-hidden rounded-[8px] border border-[#cbd3de] bg-white dark:border-[#314056] dark:bg-[#101a28] xl:sticky xl:top-24"><div className="flex items-center justify-between border-b border-[#d5dce5] px-4 py-3 dark:border-[#314056]"><h2 className="font-bold">Trust policy</h2><button type="button" className="flex items-center gap-2 text-sm text-[#738095] hover:text-current">Close <XMarkIcon className="h-4 w-4" /></button></div><div className="flex items-center gap-3 border-b border-[#d5dce5] p-4 dark:border-[#314056]"><IssuerMark issuer={current.issuer} /><div><h3 className="text-lg font-bold">{current.name}</h3><p className="text-xs text-[#6f7c90]">{current.issuer}</p><StatusBadge status={current.status} /></div></div><dl className="grid grid-cols-[142px_minmax(0,1fr)] gap-x-3 gap-y-2 border-b border-[#d5dce5] p-4 text-[13px] dark:border-[#314056]"><dt className="text-[#738095]">Category</dt><dd>{current.category}</dd><dt className="text-[#738095]">Accepted issuer</dt><dd>{current.issuer}</dd><dt className="text-[#738095]">Standard validity</dt><dd>{validityLabel(current.validityMonths)}</dd><dt className="text-[#738095]">Renewal requirement</dt><dd>{renewalLabel(current.policy.renewalRequirement)}</dd><dt className="text-[#738095]">Official verification URL</dt><dd className="min-w-0">{current.verificationUrl ? <a href={current.verificationUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 truncate text-[#316be8] hover:underline">{current.verificationUrl.replace(/^https?:\/\//, '')}<ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 shrink-0" /></a> : 'Manual review'}</dd><dt className="text-[#738095]">Credential ID pattern</dt><dd>{current.policy.credentialIdPattern || `${current.issuer.split(/\s+/).map(part => part[0]).join('').slice(0, 4).toUpperCase()}-\\d{6,10}`}</dd><dt className="text-[#738095]">Geographic coverage</dt><dd>{current.policy.geographicCoverage}</dd><dt className="text-[#738095]">Policy owner</dt><dd>{current.policy.policyOwner}</dd><dt className="text-[#738095]">Approved on</dt><dd>{formatDate(current.verifiedAt)}</dd><dt className="text-[#738095]">Next review</dt><dd>{formatDate(current.policy.nextReviewAt || nextReviewDate(current.verifiedAt))}</dd></dl><div className="border-b border-[#d5dce5] p-4 dark:border-[#314056]"><h3 className="text-sm font-bold">Verification requirements</h3><ul className="mt-3 space-y-2 text-xs">{(current.policy.verificationRequirements.length ? current.policy.verificationRequirements : ['Credential ID must be provided and match the official registry.', 'Credential must be in active status.', 'Name on credential must match employee record.', current.verificationUrl ? 'Verification performed via official issuer registry.' : 'Manual authenticity review required.']).map(item => <li key={item} className="flex items-start gap-2"><CheckCircleIcon className="mt-px h-4 w-4 shrink-0 text-lime-500" />{item}</li>)}</ul></div><div className="border-b border-[#d5dce5] p-4 text-xs dark:border-[#314056]"><h3 className="text-sm font-bold">Policy change note</h3><p className="mt-2 text-[#6f7c90] dark:text-zinc-300">{current.policy.policyChangeNote || 'No policy change note has been recorded.'}</p><p className="mt-2 text-[#6f7c90] dark:text-zinc-400">Updated on {formatDate(current.createdAt || current.verifiedAt)} by {current.policy.policyOwner || 'Learning & Development'}</p></div><div className="flex gap-2 p-4"><Button type="button" onClick={() => onEdit(current)} className="flex-1 bg-[#316be8] hover:bg-[#285dce]"><PencilSquareIcon className="mr-2 h-4 w-4" />Edit trust policy</Button><Button type="button" variant="outline" onClick={() => onArchive(current)} className="border-[#93a0b2] bg-transparent"><TrashIcon className="mr-2 h-4 w-4" />Archive</Button><Button type="button" variant="outline" size="icon" className="border-[#93a0b2] bg-transparent"><EllipsisHorizontalIcon className="h-5 w-5" /></Button></div></aside>}
  </div>;
}

function EmptyTrustedCertificates({ onAdd }: { onAdd: () => void }) {
  return <section className="mt-6 flex min-h-[440px] flex-col items-center justify-center rounded-[8px] border border-dashed border-[#aeb9c7] px-6 text-center dark:border-[#415069]"><span className="grid h-16 w-16 place-items-center rounded-full bg-[#eaf2ff] dark:bg-[#142744]"><ShieldCheckIcon className="h-8 w-8 text-[#316be8]" /></span><h2 className="mt-5 text-xl font-bold">Build your trusted issuer network</h2><p className="mt-2 max-w-md text-sm leading-6 text-[#6f7c90] dark:text-zinc-400">Add an accepted credential with its issuer, validity rule, and official verification source. Issuer coverage will be created automatically from live certificate records.</p><Button type="button" onClick={onAdd} className="mt-5 bg-[#316be8] hover:bg-[#285dce]"><PlusIcon className="mr-2 h-4 w-4" />Add trusted certificate</Button></section>;
}
