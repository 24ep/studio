"use client";

import * as React from 'react';
import { Briefcase, CalendarDays, Edit3, FileClock, GraduationCap, IdCard, LockKeyhole, MapPin, Save, ShieldCheck, Sparkles, UserRound } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getUnderlineNavTriggerClassName } from '@/components/ui/underline-nav';
import { EmployeeProfileScaffold } from '@/components/hr/EmployeeProfileScaffold';
import { EmployeeSharedPersonProfile } from '@/components/hr/EmployeeSharedPersonProfile';
import type { HrCrudRecord } from '@/lib/hr/hr-crud';
import { cn } from '@/lib/utils';
import { ApprovalTimeline, EmptyState, InfoRow, Section, StatusBadge } from './EssShared';
import type { EssDashboard, EssRow } from './ess-types';
import { dateValue, statusLabel, stringValue } from './ess-types';

const requestableFields = [
  { value: 'preferredName', label: 'Preferred name', structured: false },
  { value: 'phone', label: 'Personal phone', structured: false },
  { value: 'address', label: 'Address', structured: true },
  { value: 'emergencyContacts', label: 'Emergency contacts', structured: true },
  { value: 'familyDependents', label: 'Family and dependents', structured: true },
  { value: 'bankInformation', label: 'Bank information', structured: true },
  { value: 'taxInformation', label: 'Tax information', structured: true },
  { value: 'governmentIdentification', label: 'Government identification', structured: true },
] as const;

type RequestableField = (typeof requestableFields)[number]['value'];
type SelfProfileTab = 'overview' | 'personal' | 'career' | 'sensitive' | 'requests';
type SelfSidebarTab = 'employment' | 'change';

const selfProfileTabs = [
  { id: 'overview' as const, label: 'My profile', icon: UserRound },
  { id: 'personal' as const, label: 'Personal', icon: IdCard },
  { id: 'career' as const, label: 'Career & skills', icon: GraduationCap },
  { id: 'sensitive' as const, label: 'Sensitive data', icon: LockKeyhole },
  { id: 'requests' as const, label: 'Change history', icon: FileClock },
];

function JsonList({ value, empty }: { value: unknown; empty: string }) {
  const items = Array.isArray(value) ? value : [];
  if (!items.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="divide-y divide-border/50">
      {items.map((item, index) => (
        <li key={index} className="py-3 text-sm">
          {typeof item === 'object' && item ? Object.values(item as Record<string, unknown>).filter(Boolean).map(String).join(' · ') : String(item)}
        </li>
      ))}
    </ul>
  );
}

export function EmployeeProfileView({
  data,
  submitting,
  mutate,
}: {
  data: EssDashboard;
  submitting: boolean;
  mutate: (url: string, method: 'POST' | 'PATCH', body: unknown, successMessage: string) => Promise<unknown>;
}) {
  const employee = data.employee;
  const [field, setField] = React.useState<RequestableField>('preferredName');
  const [requestedValue, setRequestedValue] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [saveAsDraft, setSaveAsDraft] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<SelfProfileTab>('overview');
  const [sidebarTab, setSidebarTab] = React.useState<SelfSidebarTab>('employment');
  const selected = requestableFields.find(item => item.value === field)!;
  const requests = data.requests.filter(item => item.request_type === 'profile_change');
  const sharedEmployee = React.useMemo<HrCrudRecord>(() => ({
    id: employee.id,
    firstName: employee.legalName.split(/\s+/).slice(0, -1).join(' ') || employee.legalName,
    lastName: employee.legalName.split(/\s+/).slice(-1).join(' '),
    preferredName: employee.preferredName,
    phone: employee.phone,
    location: employee.location,
    personProfile: {
      firstName: employee.legalName.split(/\s+/).slice(0, -1).join(' ') || employee.legalName,
      lastName: employee.legalName.split(/\s+/).slice(-1).join(' '),
      preferredName: employee.preferredName,
      email: employee.email,
      phone: employee.phone,
      location: employee.location,
      education: employee.profile.education,
      workExperience: employee.profile.workExperience,
      skills: employee.profile.skills,
    },
  }), [employee]);

  const submit = async () => {
    let value: unknown = requestedValue;
    if (selected.structured) {
      try {
        value = JSON.parse(requestedValue);
      } catch {
        value = requestedValue.includes(',') ? requestedValue.split(',').map(item => item.trim()).filter(Boolean) : { value: requestedValue };
      }
    }
    const created = await mutate('/api/ess/requests', 'POST', {
      requestType: 'profile_change',
      title: `Update ${selected.label}`,
      reason,
      values: { [field]: value },
      originalValues: {},
      saveAsDraft,
    }, saveAsDraft ? 'Profile request saved as draft.' : 'Profile change sent for approval.');
    if (created) {
      setRequestedValue('');
      setReason('');
      setSaveAsDraft(false);
    }
  };

  const initials = employee.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <EmployeeProfileScaffold
      header={(
        <header className="sticky top-0 z-30 border-b border-border bg-background p-4">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-10 lg:items-center lg:gap-6">
            <div className="lg:col-span-7">
              <div className="flex items-start gap-3 sm:items-center sm:gap-5">
                <Avatar className="h-16 w-16 border border-border sm:h-20 sm:w-20">
                  {employee.profilePhotoUrl ? <AvatarImage src={employee.profilePhotoUrl} alt="" /> : null}
                  <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={employee.status} />
                    <Badge variant={employee.profileCompletion === 100 ? 'success' : 'outline'} className="rounded-full">
                      {employee.profileCompletion}% profile complete
                    </Badge>
                  </div>
                  <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{employee.name}</h1>
                  <div className="mt-3 flex max-w-sm items-center gap-3" aria-label={`Profile ${employee.profileCompletion}% complete`}>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${employee.profileCompletion}%` }} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{employee.profileCompletion}%</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{employee.jobTitle || 'Role not assigned'} <span aria-hidden>•</span> {employee.employeeNumber}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pl-12 text-sm lg:col-span-3 lg:justify-end lg:pl-0">
              <ProfileHeaderFact icon={Briefcase} label="Employment" value={statusLabel(employee.employmentType)} />
              <ProfileHeaderFact icon={MapPin} label="Location" value={employee.location || 'Not set'} />
              <ProfileHeaderFact icon={CalendarDays} label="Hire date" value={dateValue(employee.hireDate)} />
            </div>
          </div>
        </header>
      )}
      navigation={<SelfProfileNavigation activeTab={activeTab} requestCount={requests.length} onTabChange={setActiveTab} />}
      sidebarNavigation={<SelfProfileSidebarNavigation activeTab={sidebarTab} onTabChange={setSidebarTab} />}
      sidebar={sidebarTab === 'employment' ? (
        <div className="space-y-1">
          <h2 className="mb-3 text-base font-semibold">Employment details</h2>
          <InfoRow label="Employee ID" value={employee.employeeNumber} permission="hr_controlled" />
          <InfoRow label="Department" value={employee.department} permission="hr_controlled" />
          <InfoRow label="Business unit" value={employee.businessUnit} permission="hr_controlled" />
          <InfoRow label="Manager" value={employee.managerName} permission="hr_controlled" />
          <InfoRow label="Work email" value={employee.email} permission="hr_controlled" />
          <InfoRow label="Work phone" value={employee.workPhone} permission="hr_controlled" />
        </div>
      ) : (
        <ChangeRequestForm
          field={field} setField={setField}
          requestedValue={requestedValue} setRequestedValue={setRequestedValue}
          reason={reason} setReason={setReason}
          saveAsDraft={saveAsDraft} setSaveAsDraft={setSaveAsDraft}
          submitting={submitting} onSubmit={submit}
        />
      )}
    >
      {activeTab === 'overview' ? <div className="grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4 sm:p-6">
          <EmployeeSharedPersonProfile employee={sharedEmployee} />
        </div>
        <Section title="Employment information" description={<><span>HR-controlled fields are read-only in ESS. </span><span className="font-medium text-foreground"><span className="text-destructive">*</span> Required</span></>}>
          <InfoRow label="Legal name" value={employee.legalName} permission="hr_controlled" required />
          <InfoRow label="Employee ID" value={employee.employeeNumber} permission="hr_controlled" required />
          <InfoRow label="Job title" value={employee.jobTitle} permission="hr_controlled" />
          <InfoRow label="Employment type" value={statusLabel(employee.employmentType)} permission="hr_controlled" required />
          <InfoRow label="Employment status" value={<StatusBadge status={employee.status} />} permission="hr_controlled" required />
          <InfoRow label="Join date" value={dateValue(employee.hireDate)} permission="hr_controlled" required />
        </Section>
        <Section title="Organization information">
          <InfoRow label="Department" value={employee.department} permission="hr_controlled" required />
          <InfoRow label="Business unit" value={employee.businessUnit} permission="hr_controlled" />
          <InfoRow label="Manager" value={employee.managerName} permission="hr_controlled" />
          <InfoRow label="Work location" value={employee.location} permission="hr_controlled" />
          <InfoRow label="Work email" value={employee.email} permission="hr_controlled" />
          <InfoRow label="Work phone" value={employee.workPhone} permission="hr_controlled" />
        </Section>
      </div> : activeTab === 'personal' ? <div className="grid gap-4">
        <div className="space-y-4">
          <Section title="Personal and contact information">
            <InfoRow label="Preferred name" value={employee.preferredName || 'Not provided'} />
            <InfoRow label="Personal phone" value={employee.phone || 'Not provided'} />
            <InfoRow label="Address" value={formatObject(employee.profile.address)} />
          </Section>
          <Section title="Emergency contacts and dependents">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Emergency contacts</h3>
            <JsonList value={employee.profile.emergencyContacts} empty="No emergency contact has been added." />
            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Family and dependents</h3>
            <JsonList value={employee.profile.familyDependents} empty="No family or dependent information has been added." />
          </Section>
        </div>
      </div> : activeTab === 'career' ? <div className="grid gap-4 md:grid-cols-2">
        <Section title="Education"><JsonList value={employee.profile.education} empty="No education records have been added." /></Section>
        <Section title="Work experience"><JsonList value={employee.profile.workExperience} empty="No prior work experience has been added." /></Section>
        <Section title="Skills"><JsonList value={employee.profile.skills} empty="No skills have been added." /></Section>
        <Section title="Certifications and languages">
          <JsonList value={employee.profile.certifications} empty="No certifications have been added." />
          <div className="mt-4 border-t border-border pt-4"><JsonList value={employee.profile.languages} empty="No languages have been added." /></div>
        </Section>
      </div> : activeTab === 'sensitive' ? <div className="grid gap-4 lg:grid-cols-3">
        {([
          ['Bank information', employee.sensitive.bankInformation],
          ['Tax information', employee.sensitive.taxInformation],
          ['Government identification', employee.sensitive.governmentIdentification],
        ] as const).map(([title, values]) => (
          <Section key={title} title={title} required={title === 'Bank information'} action={<LockKeyhole className="h-4 w-4 text-muted-foreground" aria-label="Masked" />}>
            <p className="mb-3 text-xs text-muted-foreground">Masked by default. Submit a verified change request to update these values.</p>
            {Object.keys(values || {}).length ? Object.entries(values).map(([key, value]) => (
              <InfoRow key={key} label={statusLabel(key)} value={<span className="font-mono tracking-wider">{stringValue(value)}</span>} />
            )) : <EmptyState title="No data available" description="Only authorized HR users can maintain this information." />}
          </Section>
        ))}
      </div> : (
        <Section title="Profile change history" description="Track drafts, approvals, comments, and revisions.">
          {requests.length ? <div className="divide-y divide-border">{requests.map(request => (
            <RequestRow key={String(request.id)} request={request} submitting={submitting} mutate={mutate} />
          ))}</div> : <EmptyState title="No profile changes yet" description="Use the Personal tab to request an update." />}
        </Section>
      )}
    </EmployeeProfileScaffold>
  );
}

function ProfileHeaderFact({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return <div className="flex min-w-0 items-center gap-2"><Icon className="h-4 w-4 shrink-0 text-primary" /><div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="max-w-36 truncate font-medium">{value}</p></div></div>;
}

function SelfProfileNavigation({ activeTab, requestCount, onTabChange }: { activeTab: SelfProfileTab; requestCount: number; onTabChange: (tab: SelfProfileTab) => void }) {
  return <div className="overflow-x-auto border-b border-border bg-background px-4 sm:px-6"><div className="flex min-w-max" role="tablist" aria-label="My profile sections">{selfProfileTabs.map(tab => { const Icon = tab.icon; const active = activeTab === tab.id; return <button key={tab.id} type="button" role="tab" aria-selected={active} onClick={() => onTabChange(tab.id)} className={getUnderlineNavTriggerClassName(active, 'px-3.5 py-3.5 text-xs font-semibold')}><Icon className="h-4 w-4" /><span>{tab.label}</span>{tab.id === 'requests' && requestCount > 0 ? <span className={cn('ml-0.5 min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] leading-4', active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>{requestCount}</span> : null}</button>; })}</div></div>;
}

function SelfProfileSidebarNavigation({ activeTab, onTabChange }: { activeTab: SelfSidebarTab; onTabChange: (tab: SelfSidebarTab) => void }) {
  const tabs = [{ id: 'employment' as const, label: 'Employment', icon: ShieldCheck }, { id: 'change' as const, label: 'Request change', icon: Sparkles }];
  return <div className="grid grid-cols-2 gap-2 border-b border-border bg-background p-3">{tabs.map(tab => { const Icon = tab.icon; const active = activeTab === tab.id; return <button key={tab.id} type="button" onClick={() => onTabChange(tab.id)} className={cn('inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', active ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground')}><Icon className="h-4 w-4" />{tab.label}</button>; })}</div>;
}

function ChangeRequestForm(props: {
  field: string;
  setField: (value: RequestableField) => void;
  requestedValue: string;
  setRequestedValue: (value: string) => void;
  reason: string;
  setReason: (value: string) => void;
  saveAsDraft: boolean;
  setSaveAsDraft: (value: boolean) => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <Section title="Request a change" description="Sensitive and controlled changes follow the configured approval path.">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="profile-field">Field</Label>
          <select id="profile-field" value={props.field} onChange={event => props.setField(event.target.value as RequestableField)} className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
            {requestableFields.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-value">Requested value</Label>
          <Textarea id="profile-value" value={props.requestedValue} onChange={event => props.setRequestedValue(event.target.value)} placeholder="Enter the new value. For multiple items, separate them with commas." className="min-h-24" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-reason">Reason</Label>
          <Textarea id="profile-reason" value={props.reason} onChange={event => props.setReason(event.target.value)} placeholder="Why is this change needed?" className="min-h-20" />
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <Input type="checkbox" checked={props.saveAsDraft} onChange={event => props.setSaveAsDraft(event.target.checked)} className="h-4 w-4" />
          Save as draft
        </label>
        <Button className="w-full sm:w-auto" disabled={props.submitting || !props.requestedValue.trim() || !props.reason.trim()} onClick={props.onSubmit}>
          {props.saveAsDraft ? <Save className="mr-2 h-4 w-4" /> : <Edit3 className="mr-2 h-4 w-4" />}
          {props.saveAsDraft ? 'Save draft' : 'Submit for approval'}
        </Button>
      </div>
    </Section>
  );
}

function RequestRow({ request, submitting, mutate }: {
  request: EssRow;
  submitting: boolean;
  mutate: (url: string, method: 'POST' | 'PATCH', body: unknown, successMessage: string) => Promise<unknown>;
}) {
  const activity = Array.isArray(request.activity) ? request.activity as EssRow[] : [];
  const action = ['pending_approval', 'returned_for_revision'].includes(String(request.status)) ? 'withdraw' : request.status === 'draft' ? 'submit' : null;
  return (
    <article className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold">{stringValue(request.title)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{stringValue(request.request_id)} · {dateValue(request.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={request.status} />
          {action && <Button variant="outline" size="sm" disabled={submitting} onClick={() => void mutate('/api/ess/requests', 'PATCH', {
            id: request.id,
            action,
            expectedVersion: request.version,
          }, action === 'withdraw' ? 'Request withdrawn.' : 'Request submitted.')}>{statusLabel(action)}</Button>}
        </div>
      </div>
      {activity.length > 0 && <details className="mt-3">
        <summary className="cursor-pointer text-xs font-medium text-primary">View activity</summary>
        <div className="mt-3 pl-1"><ApprovalTimeline activities={activity} /></div>
      </details>}
    </article>
  );
}

function formatObject(value: unknown) {
  if (!value || typeof value !== 'object') return 'Not provided';
  const text = Object.values(value as Record<string, unknown>).filter(Boolean).map(String).join(', ');
  return text || 'Not provided';
}
