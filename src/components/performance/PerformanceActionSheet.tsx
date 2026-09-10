"use client";

import * as React from 'react';
import {
  Award,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  FileCheck2,
  MessageSquareText,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { EmployeeOption } from '@/components/hr/EmployeeOption';
import type { PerformanceWorkspaceData } from '@/lib/performance/performance-contracts';
import { useDropdownOptions } from '@/hooks/use-dropdown-options';
import { defaultDropdownOptions } from '@/lib/dropdown-option-catalog';

export type PerformanceComposerMode =
  | 'check-in'
  | 'feedback'
  | 'recognition'
  | 'development'
  | 'evidence'
  | 'complete-check-in'
  | 'update-development';

export function PerformanceActionSheet({
  mode,
  record,
  data,
  saving,
  onClose,
  onSubmit,
}: {
  mode: PerformanceComposerMode | null;
  record: Record<string, unknown> | null;
  data: PerformanceWorkspaceData;
  saving: boolean;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>, successMessage: string) => Promise<boolean>;
}) {
  return (
    <Sheet open={Boolean(mode)} onOpenChange={open => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-xl">
        {mode ? (
          <>
            <SheetHeader className="border-b border-slate-200 p-5 pr-14 text-left dark:border-slate-800">
              <SheetTitle>{composerMeta[mode].title}</SheetTitle>
              <SheetDescription>{composerMeta[mode].description}</SheetDescription>
            </SheetHeader>
            <ComposerForm
              key={`${mode}-${String(record?.id || '')}`}
              mode={mode}
              record={record}
              data={data}
              saving={saving}
              onClose={onClose}
              onSubmit={onSubmit}
            />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

const composerMeta: Record<PerformanceComposerMode, { title: string; description: string }> = {
  'check-in': { title: 'Schedule a performance check-in', description: 'Prepare a focused conversation without starting a formal appraisal.' },
  feedback: { title: 'Continuous feedback', description: 'Request specific input or give evidence-based feedback.' },
  recognition: { title: 'Recognize an employee', description: 'Connect appreciation to a contribution, value, or competency.' },
  development: { title: 'Development plan', description: 'Create a focused plan or add an action linked to Learning when relevant.' },
  evidence: { title: 'Submit competency evidence', description: 'Add a real work example for review and validation.' },
  'complete-check-in': { title: 'Complete check-in', description: 'Capture shared outcomes and follow-up action without exposing private drafts.' },
  'update-development': { title: 'Update development action', description: 'Record progress and keep development work current.' },
};

function ComposerForm({
  mode,
  record,
  data,
  saving,
  onClose,
  onSubmit,
}: {
  mode: PerformanceComposerMode;
  record: Record<string, unknown> | null;
  data: PerformanceWorkspaceData;
  saving: boolean;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>, successMessage: string) => Promise<boolean>;
}) {
  const [form, setForm] = React.useState<Record<string, string | boolean>>(() => initialForm(mode, record, data));
  const [error, setError] = React.useState<string | null>(null);
  const update = (field: string, value: string | boolean) => setForm(current => ({ ...current, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const payload = buildPayload(mode, form, record, data);
      const success = await onSubmit(payload.body, payload.message);
      if (success) onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Complete the required fields.');
    }
  };

  return (
    <form onSubmit={submit} className="flex min-h-[calc(100dvh-7.5rem)] flex-col">
      <div className="flex-1 space-y-5 p-5">
        {mode === 'check-in' ? <CheckInFields form={form} update={update} data={data} /> : null}
        {mode === 'feedback' ? <FeedbackFields form={form} update={update} data={data} /> : null}
        {mode === 'recognition' ? <RecognitionFields form={form} update={update} data={data} /> : null}
        {mode === 'evidence' ? <EvidenceFields form={form} update={update} data={data} /> : null}
        {mode === 'development' ? <DevelopmentFields form={form} update={update} data={data} /> : null}
        {mode === 'complete-check-in' ? <CompleteCheckInFields form={form} update={update} record={record} /> : null}
        {mode === 'update-development' ? <UpdateDevelopmentFields form={form} update={update} record={record} /> : null}
        {error ? <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200">{error}</p> : null}
      </div>
      <SheetFooter className="sticky bottom-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <Button type="submit" disabled={saving} className="min-h-11 bg-[#263f73] text-white hover:bg-[#1f345f]">
          {saving ? 'Saving…' : composerMeta[mode].title}
        </Button>
        <Button type="button" variant="outline" className="min-h-11" onClick={onClose} disabled={saving}>Cancel</Button>
      </SheetFooter>
    </form>
  );
}

function CheckInFields({ form, update, data }: FieldsProps) {
  const conversationTypes = useDropdownOptions('performance_conversation_types', defaultDropdownOptions('performance_conversation_types'));
  return (
    <>
      <ComposerIntro icon={CalendarClock} title="Prepare together" description="Shared notes are visible to both participants. Employee drafts and manager-private notes are stored separately." />
      <EmployeeField form={form} update={update} data={data} />
      <Field label="Conversation type">
        <Select value={String(form.type)} onValueChange={value => update('type', value)}>
          <SelectTrigger className="h-11 bg-white dark:bg-slate-900"><SelectValue /></SelectTrigger>
          <SelectContent>
            {conversationTypes.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Meeting date and time">
        <Input type="datetime-local" value={String(form.meetingDate)} onChange={event => update('meetingDate', event.target.value)} className="h-11" required />
      </Field>
      <Field label="Agenda">
        <Textarea value={String(form.agenda)} onChange={event => update('agenda', event.target.value)} className="min-h-28" placeholder="What should this conversation accomplish?" required />
      </Field>
      <Field label="Shared preparation notes" optional>
        <Textarea value={String(form.sharedNotes)} onChange={event => update('sharedNotes', event.target.value)} className="min-h-24" placeholder="Visible to employee and manager" />
      </Field>
      <Field label="Your private draft" optional helper="Visible only to you. Managers cannot read employee-private drafts.">
        <Textarea value={String(form.employeeDraftNotes)} onChange={event => update('employeeDraftNotes', event.target.value)} className="min-h-20" />
      </Field>
      {data.permissions.canViewPrivateManagerNotes ? (
        <Field label="Manager-private note" optional helper="Protected by backend permissions and never returned to the employee.">
          <Textarea value={String(form.managerPrivateNotes)} onChange={event => update('managerPrivateNotes', event.target.value)} className="min-h-20" />
        </Field>
      ) : null}
    </>
  );
}

function FeedbackFields({ form, update, data }: FieldsProps) {
  const feedbackTypes = useDropdownOptions('performance_feedback_types', defaultDropdownOptions('performance_feedback_types'));
  const requestMode = form.feedbackMode === 'request';
  return (
    <>
      <ComposerIntro icon={MessageSquareText} title="Be specific and useful" description="Use observable context. Anonymous feedback is available only when organization policy enables it." />
      <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
        <button type="button" className={`min-h-10 rounded-md text-sm font-bold ${requestMode ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-slate-50' : 'text-slate-500'}`} onClick={() => update('feedbackMode', 'request')}>Request feedback</button>
        <button type="button" className={`min-h-10 rounded-md text-sm font-bold ${!requestMode ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-slate-50' : 'text-slate-500'}`} onClick={() => update('feedbackMode', 'give')}>Give feedback</button>
      </div>
      {requestMode ? (
        <EmployeeSelect label="Request from" value={String(form.requestedProviderId)} onChange={value => update('requestedProviderId', value)} data={data} excludeSelected />
      ) : (
        <>
          <EmployeeField form={form} update={update} data={data} labelText="Feedback recipient" field="recipientId" />
          <Field label="Feedback type">
            <Select value={String(form.feedbackType)} onValueChange={value => update('feedbackType', value)}>
              <SelectTrigger className="h-11 bg-white dark:bg-slate-900"><SelectValue /></SelectTrigger>
              <SelectContent>{feedbackTypes.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Visibility">
            <Select value={String(form.visibility)} onValueChange={value => update('visibility', value)}>
              <SelectTrigger className="h-11 bg-white dark:bg-slate-900"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recipient">Visible to recipient</SelectItem>
                <SelectItem value="manager">Visible to manager</SelectItem>
                {data.permissions.canViewOrganization ? <SelectItem value="hr">Visible to HR</SelectItem> : null}
              </SelectContent>
            </Select>
          </Field>
        </>
      )}
      <Field label="Context">
        <Textarea value={String(form.context)} onChange={event => update('context', event.target.value)} className="min-h-24" placeholder="Project, moment, or decision you want feedback about" required />
      </Field>
      {!requestMode ? (
        <>
          <Field label="What went well" optional><Textarea value={String(form.wentWell)} onChange={event => update('wentWell', event.target.value)} className="min-h-24" /></Field>
          <Field label="Development suggestion" optional><Textarea value={String(form.improvementSuggestion)} onChange={event => update('improvementSuggestion', event.target.value)} className="min-h-24" /></Field>
          <Field label="Recommended action" optional><Textarea value={String(form.recommendedAction)} onChange={event => update('recommendedAction', event.target.value)} className="min-h-20" /></Field>
        </>
      ) : null}
      <Field label="Related project" optional><Input value={String(form.relatedProject)} onChange={event => update('relatedProject', event.target.value)} className="h-11" /></Field>
      <Field label="Related competency" optional><Input value={String(form.relatedCompetency)} onChange={event => update('relatedCompetency', event.target.value)} className="h-11" /></Field>
    </>
  );
}

function RecognitionFields({ form, update, data }: FieldsProps) {
  const recognitionCategories = useDropdownOptions('recognition_categories', defaultDropdownOptions('recognition_categories'));
  return (
    <>
      <ComposerIntro icon={Award} title="Recognize the contribution" description="Keep recognition meaningful and tied to work rather than popularity metrics." />
      <EmployeeField form={form} update={update} data={data} labelText="Recipient" field="recipientId" />
      <Field label="Recognition category">
        <Select value={String(form.category)} onValueChange={value => update('category', value)}>
          <SelectTrigger className="h-11 bg-white dark:bg-slate-900"><SelectValue /></SelectTrigger>
          <SelectContent>{recognitionCategories.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="Recognition message"><Textarea value={String(form.message)} onChange={event => update('message', event.target.value)} className="min-h-32" placeholder="Describe the contribution and its impact" required /></Field>
      <Field label="Company value" optional><Input value={String(form.companyValue)} onChange={event => update('companyValue', event.target.value)} className="h-11" /></Field>
      <Field label="Related project" optional><Input value={String(form.relatedProject)} onChange={event => update('relatedProject', event.target.value)} className="h-11" /></Field>
    </>
  );
}

function EvidenceFields({ form, update, data }: FieldsProps) {
  const evidenceTypes = useDropdownOptions('performance_evidence_types', defaultDropdownOptions('performance_evidence_types'));
  return (
    <>
      <ComposerIntro icon={FileCheck2} title="Use verifiable evidence" description="Evidence supports competency assessment but does not change the competency framework." />
      <EmployeeField form={form} update={update} data={data} />
      <Field label="Competency"><Input value={String(form.competencyName)} onChange={event => update('competencyName', event.target.value)} className="h-11" required /></Field>
      <Field label="Evidence type">
        <Select value={String(form.evidenceType)} onValueChange={value => update('evidenceType', value)}>
          <SelectTrigger className="h-11 bg-white dark:bg-slate-900"><SelectValue /></SelectTrigger>
          <SelectContent>{evidenceTypes.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="Evidence title"><Input value={String(form.title)} onChange={event => update('title', event.target.value)} className="h-11" required /></Field>
      <Field label="Description" optional><Textarea value={String(form.description)} onChange={event => update('description', event.target.value)} className="min-h-28" /></Field>
      <Field label="Evidence link" optional><Input type="url" value={String(form.evidenceUrl)} onChange={event => update('evidenceUrl', event.target.value)} className="h-11" placeholder="https://" /></Field>
    </>
  );
}

function DevelopmentFields({ form, update, data }: FieldsProps) {
  const activityTypes = useDropdownOptions('development_activity_types', defaultDropdownOptions('development_activity_types'));
  const planTypes = useDropdownOptions('development_plan_types', defaultDropdownOptions('development_plan_types'));
  const hasPlans = data.developmentPlans.length > 0;
  const actionMode = hasPlans && form.developmentMode === 'action';
  return (
    <>
      <ComposerIntro icon={BookOpenCheck} title="Turn needs into action" description="Link to Learning when appropriate; course management stays in Learning." />
      <EmployeeField form={form} update={update} data={data} />
      {hasPlans ? (
        <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
          <button type="button" className={`min-h-10 rounded-md text-sm font-bold ${!actionMode ? 'bg-white shadow-sm dark:bg-slate-800' : 'text-slate-500'}`} onClick={() => update('developmentMode', 'plan')}>New plan</button>
          <button type="button" className={`min-h-10 rounded-md text-sm font-bold ${actionMode ? 'bg-white shadow-sm dark:bg-slate-800' : 'text-slate-500'}`} onClick={() => update('developmentMode', 'action')}>Add action</button>
        </div>
      ) : null}
      {actionMode ? (
        <>
          <Field label="Development plan">
            <Select value={String(form.planId)} onValueChange={value => update('planId', value)}>
              <SelectTrigger className="h-11 bg-white dark:bg-slate-900"><SelectValue /></SelectTrigger>
              <SelectContent>{data.developmentPlans.map(plan => <SelectItem key={String(plan.id)} value={String(plan.id)}>{String(plan.title)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Action title"><Input value={String(form.title)} onChange={event => update('title', event.target.value)} className="h-11" required /></Field>
          <Field label="Action type">
            <Select value={String(form.actionType)} onValueChange={value => update('actionType', value)}>
              <SelectTrigger className="h-11 bg-white dark:bg-slate-900"><SelectValue /></SelectTrigger>
              <SelectContent>{activityTypes.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Description" optional><Textarea value={String(form.description)} onChange={event => update('description', event.target.value)} className="min-h-24" /></Field>
          <Field label="Related competency" optional><Input value={String(form.relatedCompetency)} onChange={event => update('relatedCompetency', event.target.value)} className="h-11" /></Field>
          <Field label="Due date" optional><Input type="date" value={String(form.dueDate)} onChange={event => update('dueDate', event.target.value)} className="h-11" /></Field>
        </>
      ) : (
        <>
          <Field label="Plan title"><Input value={String(form.title)} onChange={event => update('title', event.target.value)} className="h-11" required /></Field>
          <Field label="Plan type">
            <Select value={String(form.planType)} onValueChange={value => update('planType', value)}>
              <SelectTrigger className="h-11 bg-white dark:bg-slate-900"><SelectValue /></SelectTrigger>
              <SelectContent>{planTypes.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Development objective"><Textarea value={String(form.aspiration)} onChange={event => update('aspiration', event.target.value)} className="min-h-28" placeholder="What should change, grow, or become possible?" /></Field>
          <Field label="Target date" optional><Input type="date" value={String(form.targetDate)} onChange={event => update('targetDate', event.target.value)} className="h-11" /></Field>
        </>
      )}
    </>
  );
}

function CompleteCheckInFields({ form, update, record }: Omit<FieldsProps, 'data'> & { record: Record<string, unknown> | null }) {
  return (
    <>
      <ComposerIntro icon={CheckCircle2} title={String(record?.agenda || 'Check-in outcomes')} description="Shared outcomes become part of the employee performance timeline." />
      <Field label="Shared notes" optional><Textarea value={String(form.sharedNotes)} onChange={event => update('sharedNotes', event.target.value)} className="min-h-28" /></Field>
      <Field label="Achievements" optional><Textarea value={String(form.achievements)} onChange={event => update('achievements', event.target.value)} className="min-h-24" /></Field>
      <Field label="Challenges" optional><Textarea value={String(form.challenges)} onChange={event => update('challenges', event.target.value)} className="min-h-24" /></Field>
      <Field label="Support required" optional><Textarea value={String(form.supportRequired)} onChange={event => update('supportRequired', event.target.value)} className="min-h-24" /></Field>
      <Field label="Follow-up item" optional><Input value={String(form.followUpTitle)} onChange={event => update('followUpTitle', event.target.value)} className="h-11" /></Field>
      {form.followUpTitle ? <Field label="Follow-up due date" optional><Input type="date" value={String(form.followUpDueDate)} onChange={event => update('followUpDueDate', event.target.value)} className="h-11" /></Field> : null}
    </>
  );
}

function UpdateDevelopmentFields({ form, update, record }: Omit<FieldsProps, 'data'> & { record: Record<string, unknown> | null }) {
  return (
    <>
      <ComposerIntro icon={CheckCircle2} title={String(record?.title || 'Development action')} description="Progress is recorded against this action using optimistic concurrency." />
      <Field label={`Progress: ${String(form.progress)}%`}>
        <input type="range" min="0" max="100" step="5" value={String(form.progress)} onChange={event => update('progress', event.target.value)} className="w-full accent-[#3459a8]" />
      </Field>
      <Field label="Status">
        <Select value={String(form.status)} onValueChange={value => update('status', value)}>
          <SelectTrigger className="h-11 bg-white dark:bg-slate-900"><SelectValue /></SelectTrigger>
          <SelectContent>{['proposed', 'approved', 'in_progress', 'at_risk', 'completed', 'cancelled'].map(value => <SelectItem key={value} value={value}>{label(value)}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="Employee comment" optional><Textarea value={String(form.employeeComments)} onChange={event => update('employeeComments', event.target.value)} className="min-h-24" /></Field>
      <Field label="Manager comment" optional><Textarea value={String(form.managerComments)} onChange={event => update('managerComments', event.target.value)} className="min-h-24" /></Field>
    </>
  );
}

type FieldsProps = {
  form: Record<string, string | boolean>;
  update: (field: string, value: string | boolean) => void;
  data: PerformanceWorkspaceData;
};

function EmployeeField({ form, update, data, labelText = 'Employee', field = 'employeeId' }: FieldsProps & { labelText?: string; field?: string }) {
  if (data.employees.length <= 1) return null;
  return <EmployeeSelect label={labelText} value={String(form[field])} onChange={value => update(field, value)} data={data} />;
}

function EmployeeSelect({ label: labelText, value, onChange, data, excludeSelected = false }: { label: string; value: string; onChange: (value: string) => void; data: PerformanceWorkspaceData; excludeSelected?: boolean }) {
  const options = excludeSelected ? data.employees.filter(item => item.id !== data.selectedEmployee?.id) : data.employees;
  return (
    <Field label={labelText}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 bg-white dark:bg-slate-900"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map(employee => <SelectItem key={employee.id} value={employee.id}><EmployeeOption name={employee.name} avatarUrl={employee.profilePhotoUrl} detail={employee.employeeNumber} /></SelectItem>)}</SelectContent>
      </Select>
    </Field>
  );
}

function Field({ label: labelText, helper, optional = false, children }: { label: string; helper?: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-bold text-slate-900 dark:text-slate-100">{labelText}</Label>
        {optional ? <span className="text-[11px] text-slate-400">Optional</span> : null}
      </div>
      {children}
      {helper ? <p className="text-xs leading-5 text-slate-500">{helper}</p> : null}
    </div>
  );
}

function ComposerIntro({ icon: Icon, title, description }: { icon: typeof Award; title: string; description: string }) {
  return <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-900/50"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#3459a8] dark:bg-blue-950/40 dark:text-blue-300"><Icon className="h-5 w-5" aria-hidden /></div><div><p className="text-sm font-bold text-slate-950 dark:text-slate-50">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div></div>;
}

function initialForm(mode: PerformanceComposerMode, record: Record<string, unknown> | null, data: PerformanceWorkspaceData) {
  const selected = data.selectedEmployee?.id || data.employees[0]?.id || '';
  const otherEmployee = data.employees.find(item => item.id !== selected)?.id || selected;
  const tomorrow = new Date(Date.now() + 86400000);
  tomorrow.setMinutes(Math.ceil(tomorrow.getMinutes() / 15) * 15, 0, 0);
  const common = { employeeId: selected, recipientId: selected };
  if (mode === 'check-in') return { ...common, type: 'one_on_one', meetingDate: toLocalDateTime(tomorrow), agenda: '', sharedNotes: '', employeeDraftNotes: '', managerPrivateNotes: '' };
  if (mode === 'feedback') return { ...common, feedbackMode: data.employees.length > 1 ? 'request' : 'give', requestedProviderId: otherEmployee, feedbackType: 'peer', visibility: 'recipient', context: '', wentWell: '', improvementSuggestion: '', recommendedAction: '', relatedProject: '', relatedCompetency: '' };
  if (mode === 'recognition') return { ...common, category: 'great_teamwork', message: '', companyValue: '', relatedProject: '' };
  if (mode === 'evidence') return { ...common, competencyName: '', evidenceType: 'project_achievement', title: '', description: '', evidenceUrl: '' };
  if (mode === 'development') return { ...common, developmentMode: data.developmentPlans.length ? 'action' : 'plan', planId: String(data.developmentPlans[0]?.id || ''), title: '', planType: 'skill_development', aspiration: '', targetDate: '', actionType: 'on_the_job', description: '', relatedCompetency: '', dueDate: '' };
  if (mode === 'complete-check-in') return { ...common, sharedNotes: String(record?.sharedNotes || ''), achievements: '', challenges: '', supportRequired: '', followUpTitle: '', followUpDueDate: '' };
  return { ...common, progress: String(record?.progress || 0), status: String(record?.status || 'in_progress'), employeeComments: String(record?.employeeComments || ''), managerComments: String(record?.managerComments || '') };
}

function buildPayload(mode: PerformanceComposerMode, form: Record<string, string | boolean>, record: Record<string, unknown> | null, data: PerformanceWorkspaceData) {
  const key = crypto.randomUUID();
  if (mode === 'check-in') return { body: { action: 'create_check_in', employeeId: form.employeeId, type: form.type, meetingDate: new Date(String(form.meetingDate)).toISOString(), agenda: form.agenda, sharedNotes: nullish(form.sharedNotes), employeeDraftNotes: nullish(form.employeeDraftNotes), managerPrivateNotes: nullish(form.managerPrivateNotes), idempotencyKey: key }, message: 'Check-in scheduled.' };
  if (mode === 'feedback' && form.feedbackMode === 'request') return { body: { action: 'request_feedback', requestedProviderId: form.requestedProviderId, context: form.context, relatedProject: nullish(form.relatedProject), relatedCompetency: nullish(form.relatedCompetency), idempotencyKey: key }, message: 'Feedback request sent.' };
  if (mode === 'feedback') return { body: { action: 'give_feedback', recipientId: form.recipientId, feedbackType: form.feedbackType, visibility: form.visibility, context: form.context, wentWell: nullish(form.wentWell), improvementSuggestion: nullish(form.improvementSuggestion), recommendedAction: nullish(form.recommendedAction), relatedProject: nullish(form.relatedProject), relatedCompetency: nullish(form.relatedCompetency), isAnonymous: false, idempotencyKey: key }, message: 'Feedback shared.' };
  if (mode === 'recognition') return { body: { action: 'recognize', recipientId: form.recipientId, category: form.category, message: form.message, companyValue: nullish(form.companyValue), relatedProject: nullish(form.relatedProject), visibility: 'recipient', idempotencyKey: key }, message: 'Recognition shared.' };
  if (mode === 'evidence') return { body: { action: 'submit_competency_evidence', employeeId: form.employeeId, competencyName: form.competencyName, evidenceType: form.evidenceType, title: form.title, description: nullish(form.description), evidenceUrl: nullish(form.evidenceUrl), idempotencyKey: key }, message: 'Competency evidence submitted.' };
  if (mode === 'development' && form.developmentMode === 'action') return { body: { action: 'add_development_action', planId: form.planId, employeeId: form.employeeId, title: form.title, description: nullish(form.description), actionType: form.actionType, relatedCompetency: nullish(form.relatedCompetency), priority: 'medium', dueDate: nullish(form.dueDate), idempotencyKey: key }, message: 'Development action added.' };
  if (mode === 'development') return { body: { action: 'create_development_plan', employeeId: form.employeeId, title: form.title, planType: form.planType, aspiration: nullish(form.aspiration), targetDate: nullish(form.targetDate), idempotencyKey: key }, message: 'Development plan proposed.' };
  if (mode === 'complete-check-in') {
    if (!record?.id) throw new Error('Check-in record unavailable.');
    const followUpItems = form.followUpTitle ? [{ title: form.followUpTitle, dueDate: nullish(form.followUpDueDate), owner: 'shared' }] : [];
    return { body: { action: 'complete_check_in', id: record.id, employeeId: data.selectedEmployee?.id, sharedNotes: nullish(form.sharedNotes), achievements: nullish(form.achievements), challenges: nullish(form.challenges), supportRequired: nullish(form.supportRequired), followUpItems, expectedVersion: record.version }, message: 'Check-in completed.' };
  }
  if (!record?.id) throw new Error('Development action unavailable.');
  return { body: { action: 'update_development_action', id: record.id, employeeId: data.selectedEmployee?.id, progress: Number(form.progress), status: form.status, employeeComments: nullish(form.employeeComments), managerComments: nullish(form.managerComments), expectedVersion: record.version }, message: 'Development action updated.' };
}

function nullish(value: string | boolean) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function label(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
}

function toLocalDateTime(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
