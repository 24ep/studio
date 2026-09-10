"use client";

import * as React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardPenLine,
  FilePlus2,
  Gavel,
  MessageSquareWarning,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
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
import { useDropdownOptions } from '@/hooks/use-dropdown-options';
import { defaultDropdownOptions } from '@/lib/dropdown-option-catalog';
import { EmployeeOption } from '@/components/hr/EmployeeOption';
import { Textarea } from '@/components/ui/textarea';
import { useLocalization } from '@/contexts/LocalizationContext';
import type { AppraisalWorkspaceData } from '@/lib/appraisal/appraisal-contracts';
import { cn } from '@/lib/utils';
import { AppraisalStatusBadge } from './appraisal-ui';

export type AppraisalActionMode =
  | 'self'
  | 'submit-self'
  | 'manager'
  | 'submit-manager'
  | 'peer'
  | 'create-cycle'
  | 'create-template'
  | 'generate-population'
  | 'stage'
  | 'calculate'
  | 'override'
  | 'calibrate'
  | 'approve'
  | 'release'
  | 'acknowledge'
  | 'appeal'
  | 'assign-reviewer';

type Translate = (key: string, fallback: string) => string;
type FormState = Record<string, string | boolean>;
type ActionModeText = Record<AppraisalActionMode, { title: string; description: string; submit: string; icon: React.ComponentType<{ className?: string }> }>;

const META = {
  self: {
    titleKey: 'appraisal.actionSheet.meta.self.title',
    titleFallback: 'Self-assessment draft',
    descriptionKey: 'appraisal.actionSheet.meta.self.description',
    descriptionFallback: 'Reflect on outcomes and evidence. Saving never changes official Goal progress.',
    submitKey: 'appraisal.actionSheet.meta.self.submit',
    submitFallback: 'Save draft',
    icon: ClipboardPenLine,
  },
  'submit-self': {
    titleKey: 'appraisal.actionSheet.meta.submitSelf.title',
    titleFallback: 'Submit self-assessment',
    descriptionKey: 'appraisal.actionSheet.meta.submitSelf.description',
    descriptionFallback: 'Confirm that the assessment is ready for your manager. Configured sections will lock.',
    submitKey: 'appraisal.actionSheet.meta.submitSelf.submit',
    submitFallback: 'Submit assessment',
    icon: Send,
  },
  manager: {
    titleKey: 'appraisal.actionSheet.meta.manager.title',
    titleFallback: 'Manager assessment',
    descriptionKey: 'appraisal.actionSheet.meta.manager.description',
    descriptionFallback: 'Evaluate results using source Goal data and the configured rating guidance.',
    submitKey: 'appraisal.actionSheet.meta.manager.submit',
    submitFallback: 'Save manager draft',
    icon: ClipboardPenLine,
  },
  'submit-manager': {
    titleKey: 'appraisal.actionSheet.meta.submitManager.title',
    titleFallback: 'Submit manager assessment',
    descriptionKey: 'appraisal.actionSheet.meta.submitManager.description',
    descriptionFallback: 'Send the manager assessment to calibration or final approval.',
    submitKey: 'appraisal.actionSheet.meta.submitManager.submit',
    submitFallback: 'Submit manager assessment',
    icon: Send,
  },
  peer: {
    titleKey: 'appraisal.actionSheet.meta.peer.title',
    titleFallback: 'Provide review feedback',
    descriptionKey: 'appraisal.actionSheet.meta.peer.description',
    descriptionFallback: 'Only the information needed for this assignment is shown. Other reviewer responses remain private.',
    submitKey: 'appraisal.actionSheet.meta.peer.submit',
    submitFallback: 'Submit feedback',
    icon: ShieldCheck,
  },
  'create-cycle': {
    titleKey: 'appraisal.actionSheet.meta.createCycle.title',
    titleFallback: 'Create appraisal cycle',
    descriptionKey: 'appraisal.actionSheet.meta.createCycle.description',
    descriptionFallback: 'Set the review period, stage deadlines, source template, rating model, and eligible population.',
    submitKey: 'appraisal.actionSheet.meta.createCycle.submit',
    submitFallback: 'Create draft cycle',
    icon: FilePlus2,
  },
  'create-template': {
    titleKey: 'appraisal.actionSheet.meta.createTemplate.title',
    titleFallback: 'Create review template',
    descriptionKey: 'appraisal.actionSheet.meta.createTemplate.description',
    descriptionFallback: 'Publish a reusable first version. Historical reviews keep the exact version assigned to them.',
    submitKey: 'appraisal.actionSheet.meta.createTemplate.submit',
    submitFallback: 'Publish template',
    icon: FilePlus2,
  },
  'generate-population': {
    titleKey: 'appraisal.actionSheet.meta.generatePopulation.title',
    titleFallback: 'Generate appraisal records',
    descriptionKey: 'appraisal.actionSheet.meta.generatePopulation.description',
    descriptionFallback: 'Generation is idempotent and skips employees already included in this cycle.',
    submitKey: 'appraisal.actionSheet.meta.generatePopulation.submit',
    submitFallback: 'Generate records',
    icon: Sparkles,
  },
  stage: {
    titleKey: 'appraisal.actionSheet.meta.stage.title',
    titleFallback: 'Change cycle stage',
    descriptionKey: 'appraisal.actionSheet.meta.stage.description',
    descriptionFallback: 'Stage changes are recorded in the immutable appraisal timeline.',
    submitKey: 'appraisal.actionSheet.meta.stage.submit',
    submitFallback: 'Change stage',
    icon: ArrowRight,
  },
  calculate: {
    titleKey: 'appraisal.actionSheet.meta.calculate.title',
    titleFallback: 'Calculate rating',
    descriptionKey: 'appraisal.actionSheet.meta.calculate.description',
    descriptionFallback: 'Use the configured section weights. Missing required inputs will block calculation.',
    submitKey: 'appraisal.actionSheet.meta.calculate.submit',
    submitFallback: 'Calculate rating',
    icon: Scale,
  },
  override: {
    titleKey: 'appraisal.actionSheet.meta.override.title',
    titleFallback: 'Override rating',
    descriptionKey: 'appraisal.actionSheet.meta.override.description',
    descriptionFallback: 'The original rating remains preserved. A reason and supporting comment are mandatory.',
    submitKey: 'appraisal.actionSheet.meta.override.submit',
    submitFallback: 'Record override',
    icon: Gavel,
  },
  calibrate: {
    titleKey: 'appraisal.actionSheet.meta.calibrate.title',
    titleFallback: 'Calibration decision',
    descriptionKey: 'appraisal.actionSheet.meta.calibrate.description',
    descriptionFallback: 'Compare calculated and manager-proposed ratings before recording a traceable decision.',
    submitKey: 'appraisal.actionSheet.meta.calibrate.submit',
    submitFallback: 'Save calibration decision',
    icon: Scale,
  },
  approve: {
    titleKey: 'appraisal.actionSheet.meta.approve.title',
    titleFallback: 'Final approval',
    descriptionKey: 'appraisal.actionSheet.meta.approve.description',
    descriptionFallback: 'Approval records the decision, comment, actor, and workflow transition.',
    submitKey: 'appraisal.actionSheet.meta.approve.submit',
    submitFallback: 'Record decision',
    icon: CheckCircle2,
  },
  release: {
    titleKey: 'appraisal.actionSheet.meta.release.title',
    titleFallback: 'Release final result',
    descriptionKey: 'appraisal.actionSheet.meta.release.description',
    descriptionFallback: 'Release validation checks rating, manager comments, calibration, and approval state.',
    submitKey: 'appraisal.actionSheet.meta.release.submit',
    submitFallback: 'Release to employee',
    icon: Send,
  },
  acknowledge: {
    titleKey: 'appraisal.actionSheet.meta.acknowledge.title',
    titleFallback: 'Acknowledge appraisal',
    descriptionKey: 'appraisal.actionSheet.meta.acknowledge.description',
    descriptionFallback: 'Acknowledgment confirms receipt of the result. It does not mean that you agree with it.',
    submitKey: 'appraisal.actionSheet.meta.acknowledge.submit',
    submitFallback: 'Confirm receipt',
    icon: CheckCircle2,
  },
  appeal: {
    titleKey: 'appraisal.actionSheet.meta.appeal.title',
    titleFallback: 'Submit appraisal appeal',
    descriptionKey: 'appraisal.actionSheet.meta.appeal.description',
    descriptionFallback: 'The originally released result is preserved while the appeal is reviewed.',
    submitKey: 'appraisal.actionSheet.meta.appeal.submit',
    submitFallback: 'Submit appeal',
    icon: MessageSquareWarning,
  },
  'assign-reviewer': {
    titleKey: 'appraisal.actionSheet.meta.assignReviewer.title',
    titleFallback: 'Assign reviewer',
    descriptionKey: 'appraisal.actionSheet.meta.assignReviewer.description',
    descriptionFallback: 'Reviewer access is restricted to this assignment and its configured visibility.',
    submitKey: 'appraisal.actionSheet.meta.assignReviewer.submit',
    submitFallback: 'Assign reviewer',
    icon: UserPlus,
  },
} as const;

function getActionMeta(t: Translate): ActionModeText {
  return {
    self: {
      title: t(META.self.titleKey, META.self.titleFallback),
      description: t(META.self.descriptionKey, META.self.descriptionFallback),
      submit: t(META.self.submitKey, META.self.submitFallback),
      icon: META.self.icon,
    },
    'submit-self': {
      title: t(META['submit-self'].titleKey, META['submit-self'].titleFallback),
      description: t(META['submit-self'].descriptionKey, META['submit-self'].descriptionFallback),
      submit: t(META['submit-self'].submitKey, META['submit-self'].submitFallback),
      icon: META['submit-self'].icon,
    },
    manager: {
      title: t(META.manager.titleKey, META.manager.titleFallback),
      description: t(META.manager.descriptionKey, META.manager.descriptionFallback),
      submit: t(META.manager.submitKey, META.manager.submitFallback),
      icon: META.manager.icon,
    },
    'submit-manager': {
      title: t(META['submit-manager'].titleKey, META['submit-manager'].titleFallback),
      description: t(META['submit-manager'].descriptionKey, META['submit-manager'].descriptionFallback),
      submit: t(META['submit-manager'].submitKey, META['submit-manager'].submitFallback),
      icon: META['submit-manager'].icon,
    },
    peer: {
      title: t(META.peer.titleKey, META.peer.titleFallback),
      description: t(META.peer.descriptionKey, META.peer.descriptionFallback),
      submit: t(META.peer.submitKey, META.peer.submitFallback),
      icon: META.peer.icon,
    },
    'create-cycle': {
      title: t(META['create-cycle'].titleKey, META['create-cycle'].titleFallback),
      description: t(META['create-cycle'].descriptionKey, META['create-cycle'].descriptionFallback),
      submit: t(META['create-cycle'].submitKey, META['create-cycle'].submitFallback),
      icon: META['create-cycle'].icon,
    },
    'create-template': {
      title: t(META['create-template'].titleKey, META['create-template'].titleFallback),
      description: t(META['create-template'].descriptionKey, META['create-template'].descriptionFallback),
      submit: t(META['create-template'].submitKey, META['create-template'].submitFallback),
      icon: META['create-template'].icon,
    },
    'generate-population': {
      title: t(META['generate-population'].titleKey, META['generate-population'].titleFallback),
      description: t(META['generate-population'].descriptionKey, META['generate-population'].descriptionFallback),
      submit: t(META['generate-population'].submitKey, META['generate-population'].submitFallback),
      icon: META['generate-population'].icon,
    },
    stage: {
      title: t(META.stage.titleKey, META.stage.titleFallback),
      description: t(META.stage.descriptionKey, META.stage.descriptionFallback),
      submit: t(META.stage.submitKey, META.stage.submitFallback),
      icon: META.stage.icon,
    },
    calculate: {
      title: t(META.calculate.titleKey, META.calculate.titleFallback),
      description: t(META.calculate.descriptionKey, META.calculate.descriptionFallback),
      submit: t(META.calculate.submitKey, META.calculate.submitFallback),
      icon: META.calculate.icon,
    },
    override: {
      title: t(META.override.titleKey, META.override.titleFallback),
      description: t(META.override.descriptionKey, META.override.descriptionFallback),
      submit: t(META.override.submitKey, META.override.submitFallback),
      icon: META.override.icon,
    },
    calibrate: {
      title: t(META.calibrate.titleKey, META.calibrate.titleFallback),
      description: t(META.calibrate.descriptionKey, META.calibrate.descriptionFallback),
      submit: t(META.calibrate.submitKey, META.calibrate.submitFallback),
      icon: META.calibrate.icon,
    },
    approve: {
      title: t(META.approve.titleKey, META.approve.titleFallback),
      description: t(META.approve.descriptionKey, META.approve.descriptionFallback),
      submit: t(META.approve.submitKey, META.approve.submitFallback),
      icon: META.approve.icon,
    },
    release: {
      title: t(META.release.titleKey, META.release.titleFallback),
      description: t(META.release.descriptionKey, META.release.descriptionFallback),
      submit: t(META.release.submitKey, META.release.submitFallback),
      icon: META.release.icon,
    },
    acknowledge: {
      title: t(META.acknowledge.titleKey, META.acknowledge.titleFallback),
      description: t(META.acknowledge.descriptionKey, META.acknowledge.descriptionFallback),
      submit: t(META.acknowledge.submitKey, META.acknowledge.submitFallback),
      icon: META.acknowledge.icon,
    },
    appeal: {
      title: t(META.appeal.titleKey, META.appeal.titleFallback),
      description: t(META.appeal.descriptionKey, META.appeal.descriptionFallback),
      submit: t(META.appeal.submitKey, META.appeal.submitFallback),
      icon: META.appeal.icon,
    },
    'assign-reviewer': {
      title: t(META['assign-reviewer'].titleKey, META['assign-reviewer'].titleFallback),
      description: t(META['assign-reviewer'].descriptionKey, META['assign-reviewer'].descriptionFallback),
      submit: t(META['assign-reviewer'].submitKey, META['assign-reviewer'].submitFallback),
      icon: META['assign-reviewer'].icon,
    },
  };
}

export function AppraisalActionSheet({
  mode,
  record,
  data,
  saving,
  onClose,
  onSubmit,
  onAutosave,
}: {
  mode: AppraisalActionMode | null;
  record: Record<string, unknown> | null;
  data: AppraisalWorkspaceData;
  saving: boolean;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>, successMessage: string) => Promise<boolean>;
  onAutosave: (body: Record<string, unknown>) => Promise<boolean>;
}) {
  const { t } = useLocalization();
  const meta = React.useMemo(() => getActionMeta(t), [t]);
  return (
    <Sheet open={Boolean(mode)} onOpenChange={open => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-2xl" sheetId="appraisal-action-sheet">
        {mode ? (
          <>
            <SheetHeader className="border-b border-slate-200 bg-[#faf9f6] p-5 pr-14 text-left dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#284a73] text-white">
                  {React.createElement(meta[mode].icon, { className: 'h-4 w-4' })}
                </div>
                <div>
                  <SheetTitle>{meta[mode].title}</SheetTitle>
                  <SheetDescription className="mt-1 leading-5">{meta[mode].description}</SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <ActionForm
              key={`${mode}-${String(record?.id || '')}`}
              meta={meta}
              mode={mode}
              record={record}
              data={data}
              saving={saving}
              onClose={onClose}
              onSubmit={onSubmit}
              onAutosave={onAutosave}
            />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function ActionForm({
  mode,
  record,
  data,
  saving,
  onClose,
  onSubmit,
  onAutosave,
  meta,
}: {
  mode: AppraisalActionMode;
  record: Record<string, unknown> | null;
  data: AppraisalWorkspaceData;
  saving: boolean;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>, successMessage: string) => Promise<boolean>;
  onAutosave: (body: Record<string, unknown>) => Promise<boolean>;
  meta: ActionModeText;
}) {
  const { t } = useLocalization();
  const [form, setForm] = React.useState<FormState>(() => initialForm(mode, record, data, t));
  const [error, setError] = React.useState<string | null>(null);
  const [draftVersion, setDraftVersion] = React.useState(Number(record?.version || 1));
  const [autosaveState, setAutosaveState] = React.useState<'idle' | 'saving' | 'saved' | 'conflict'>('idle');
  const initialFingerprint = React.useRef(JSON.stringify(form));
  const lastSavedFingerprint = React.useRef(initialFingerprint.current);
  const update = (field: string, value: string | boolean) => setForm(current => ({ ...current, [field]: value }));

  React.useEffect(() => {
    if (mode !== 'self' || saving || autosaveState === 'saving') return;
    const fingerprint = JSON.stringify(form);
    if (fingerprint === initialFingerprint.current || fingerprint === lastSavedFingerprint.current) return;
    const timer = window.setTimeout(async () => {
      setAutosaveState('saving');
      try {
        const payload = buildPayload(mode, form, record ? { ...record, version: draftVersion } : null, data, t);
        const success = await onAutosave(payload.body);
        if (success) {
          lastSavedFingerprint.current = fingerprint;
          setDraftVersion(version => version + 1);
          setAutosaveState('saved');
        } else {
          setAutosaveState('conflict');
        }
      } catch {
        setAutosaveState('conflict');
      }
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [autosaveState, data, draftVersion, form, mode, onAutosave, record, saving, t]);

  React.useEffect(() => {
    if (mode !== 'self') return;
    const warn = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(form) !== lastSavedFingerprint.current && autosaveState !== 'saved') {
        event.preventDefault();
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [autosaveState, form, mode]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const payload = buildPayload(mode, form, record ? { ...record, version: draftVersion } : null, data, t);
      const success = await onSubmit(payload.body, payload.message);
      if (success) onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('appraisal.actionSheet.errors.submitFailure', 'Complete the required fields.'));
    }
  };

  return (
    <form onSubmit={submit} className="flex min-h-[calc(100dvh-7.5rem)] flex-col">
      <div className="flex-1 space-y-5 p-5 sm:p-6">
        {record && ['self', 'submit-self', 'manager', 'submit-manager', 'calculate', 'override', 'calibrate', 'approve', 'release', 'acknowledge', 'appeal', 'assign-reviewer'].includes(mode) ? (
          <ReviewContext record={record} />
        ) : null}
        {mode === 'self' ? (
          <div role="status" aria-live="polite" className={cn(
            'flex min-h-9 items-center justify-between border px-3 text-xs font-semibold',
            autosaveState === 'conflict'
              ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200'
              : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900',
          )}>
            <span>
              {autosaveState === 'saving'
                ? t('appraisal.actionSheet.autosave.saving', 'Autosaving to the appraisal record...')
                : autosaveState === 'saved'
                  ? t('appraisal.actionSheet.autosave.saved', 'All draft changes saved')
                  : autosaveState === 'conflict'
                    ? t('appraisal.actionSheet.autosave.conflict', 'Autosave paused - refresh to resolve a newer version')
                    : t('appraisal.actionSheet.autosave.ready', 'Draft autosave is ready')}
            </span>
            <span className="tabular-nums">v{draftVersion}</span>
          </div>
        ) : null}
        {mode === 'self' ? <SelfFields form={form} update={update} record={record} /> : null}
        {mode === 'manager' ? <ManagerFields form={form} update={update} record={record} /> : null}
        {mode === 'peer' ? <PeerFields form={form} update={update} /> : null}
        {mode === 'create-cycle' ? <CycleFields form={form} update={update} data={data} /> : null}
        {mode === 'create-template' ? <TemplateFields form={form} update={update} /> : null}
        {mode === 'stage' ? <StageFields form={form} update={update} /> : null}
        {mode === 'override' ? <OverrideFields form={form} update={update} /> : null}
        {mode === 'calibrate' ? <CalibrationFields form={form} update={update} record={record} /> : null}
        {mode === 'approve' ? <ApprovalFields form={form} update={update} /> : null}
        {mode === 'acknowledge' ? <AcknowledgmentFields form={form} update={update} /> : null}
        {mode === 'appeal' ? <AppealFields form={form} update={update} /> : null}
        {mode === 'assign-reviewer' ? <ReviewerFields form={form} update={update} data={data} /> : null}
        {['submit-self', 'submit-manager', 'generate-population', 'calculate', 'release'].includes(mode) ? <Confirmation mode={mode} /> : null}
        {error ? <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{error}</p> : null}
      </div>
      <SheetFooter className="sticky bottom-0 gap-2 border-t border-slate-200 bg-white/95 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <Button type="submit" disabled={saving || autosaveState === 'saving'} className="min-h-11 bg-[#284a73] text-white hover:bg-[#203c5e]">
          {saving ? t('appraisal.actionSheet.form.working', 'Working...') : meta[mode].submit}
        </Button>
        <Button type="button" variant="outline" className="min-h-11" onClick={onClose} disabled={saving}>{t('appraisal.actionSheet.form.cancel', 'Cancel')}</Button>
      </SheetFooter>
    </form>
  );
}

function ReviewContext({ record }: { record: Record<string, unknown> }) {
  const { t } = useLocalization();
  return (
    <div className="border border-slate-200 bg-[#faf9f6] p-4 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-950 dark:text-slate-50">{String(record.employeeName || record.name || t('appraisal.actionSheet.fallback.record', 'Appraisal record'))}</p>
          <p className="mt-1 text-xs text-slate-500">{String(record.cycleName || '')}{record.department ? ` - ${String(record.department)}` : ''}</p>
        </div>
        <AppraisalStatusBadge status={record.status} />
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  const id = React.useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {React.isValidElement(children) ? React.cloneElement(children as React.ReactElement<{ id?: string }>, { id }) : children}
      {hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
    </div>
  );
}

type FieldsProps = { form: FormState; update: (field: string, value: string | boolean) => void; record?: Record<string, unknown> | null; data?: AppraisalWorkspaceData };

function SelfFields({ form, update, record }: FieldsProps) {
  const { t } = useLocalization();
  const goals = arrayValue(record?.goals);
  return (
    <>
      <Field label={t('appraisal.actionSheet.fields.achievementSummary.label', 'Achievement summary')}>
        <Textarea value={String(form.summary)} onChange={event => update('summary', event.target.value)} className="min-h-32" maxLength={12000} required />
      </Field>
      {goals.length ? (
        <div className="space-y-3">
          <Label>{t('appraisal.actionSheet.fields.goalAchievement.label', 'Goal achievement')}</Label>
          <p className="text-xs leading-5 text-slate-500">{t('appraisal.actionSheet.fields.goalAchievement.hint', 'Progress is read-only and comes from Goal. Your rating and evidence are appraisal inputs only.')}</p>
          {goals.map(goal => (
            <div key={String(goal.id)} className="border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-sm font-bold">{String(goal.title)}</p><p className="mt-1 text-xs text-slate-500">{Number(goal.progress || 0)}% {t('appraisal.actionSheet.fields.goalAchievement.officialProgress', 'official progress')} - {String(goal.status || t('appraisal.actionSheet.defaults.goalStatusActive', 'active'))}</p></div>
                <Input aria-label={t('appraisal.actionSheet.fields.goalAchievement.goalRatingAria', `Achievement rating for ${String(goal.title)}`)} type="number" min="0" max="100" className="h-10 w-24" value={String(form[`goal:${String(goal.id)}`] || '')} onChange={event => update(`goal:${String(goal.id)}`, event.target.value)} placeholder={t('appraisal.actionSheet.placeholders.goalRating', '0-100')} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <Field label={t('appraisal.actionSheet.fields.strengths.label', 'Strengths and key contributions')}>
        <Textarea value={String(form.strengths)} onChange={event => update('strengths', event.target.value)} className="min-h-28" maxLength={8000} />
      </Field>
      <Field label={t('appraisal.actionSheet.fields.developmentAreas.label', 'Challenges and development areas')}>
        <Textarea value={String(form.developmentAreas)} onChange={event => update('developmentAreas', event.target.value)} className="min-h-28" maxLength={8000} />
      </Field>
      <Field label={t('appraisal.actionSheet.fields.careerAspiration.label', 'Career aspiration')}>
        <Textarea value={String(form.careerAspiration)} onChange={event => update('careerAspiration', event.target.value)} className="min-h-24" maxLength={8000} />
      </Field>
    </>
  );
}

function ManagerFields({ form, update, record }: FieldsProps) {
  const { t } = useLocalization();
  const goals = arrayValue(record?.goals);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('appraisal.actionSheet.fields.managerRating.label', 'Manager-proposed rating')} hint={t('appraisal.actionSheet.fields.managerRating.hint', 'Use the configured 0-100 scale. The label is resolved from the assigned rating model.')}>
          <Input type="number" min="0" max="100" step="0.1" value={String(form.rating)} onChange={event => update('rating', event.target.value)} required />
        </Field>
        <div className="border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          {t('appraisal.actionSheet.manager.assistance', 'Employee self-rating remains evidence, not the official Goal result. Calibration preserves both your proposal and any later adjustment.')}
        </div>
      </div>
      {goals.map(goal => (
        <div key={String(goal.id)} className="border border-slate-200 p-3 dark:border-slate-800">
          <div className="grid gap-3 sm:grid-cols-[1fr_120px] sm:items-center">
            <div><p className="text-sm font-bold">{String(goal.title)}</p><p className="mt-1 text-xs text-slate-500">{Number(goal.progress || 0)}% {t('appraisal.actionSheet.fields.goalAchievement.officialProgress', 'official progress')}</p></div>
            <Input aria-label={t('appraisal.actionSheet.fields.goalAchievement.managerRatingAria', `Manager rating for ${String(goal.title)}`)} type="number" min="0" max="100" value={String(form[`goal:${String(goal.id)}`] || '')} onChange={event => update(`goal:${String(goal.id)}`, event.target.value)} placeholder={t('appraisal.actionSheet.fields.goalAchievement.ratingPlaceholder', 'Rating')} />
          </div>
        </div>
      ))}
      <Field label={t('appraisal.actionSheet.fields.managerComments.label', 'Manager comments')}>
        <Textarea value={String(form.comments)} onChange={event => update('comments', event.target.value)} className="min-h-36" maxLength={12000} required />
      </Field>
      <Field label={t('appraisal.actionSheet.fields.strengths.label', 'Strengths')}>
        <Textarea value={String(form.strengths)} onChange={event => update('strengths', event.target.value)} className="min-h-24" />
      </Field>
      <Field label={t('appraisal.actionSheet.fields.developmentAreas.label', 'Development areas')}>
        <Textarea value={String(form.developmentAreas)} onChange={event => update('developmentAreas', event.target.value)} className="min-h-24" />
      </Field>
      <Field label={t('appraisal.actionSheet.fields.developmentRecommendation.label', 'Development recommendation')} hint={t('appraisal.actionSheet.fields.developmentRecommendation.hint', 'This can become a Performance development action or link to Learning after completion.')}>
        <Textarea value={String(form.developmentRecommendation)} onChange={event => update('developmentRecommendation', event.target.value)} className="min-h-24" />
      </Field>
    </>
  );
}

function PeerFields({ form, update }: FieldsProps) {
  const { t } = useLocalization();
  return (
    <>
      <Field label={t('appraisal.actionSheet.fields.peerRating.label', 'Overall contribution rating')}>
        <Input type="number" min="0" max="100" step="0.1" value={String(form.rating)} onChange={event => update('rating', event.target.value)} required />
      </Field>
      <Field label={t('appraisal.actionSheet.fields.observedStrengths.label', 'Observed strengths')}>
        <Textarea value={String(form.strengths)} onChange={event => update('strengths', event.target.value)} className="min-h-28" required />
      </Field>
      <Field label={t('appraisal.actionSheet.fields.developmentSuggestions.label', 'Development suggestions')}>
        <Textarea value={String(form.developmentAreas)} onChange={event => update('developmentAreas', event.target.value)} className="min-h-28" required />
      </Field>
      <Field label={t('appraisal.actionSheet.fields.additionalContext.label', 'Additional context')}>
        <Textarea value={String(form.comments)} onChange={event => update('comments', event.target.value)} className="min-h-24" />
      </Field>
    </>
  );
}

function CycleFields({ form, update, data }: FieldsProps & { data: AppraisalWorkspaceData }) {
  const cycleTypes = useDropdownOptions('appraisal_cycle_types', defaultDropdownOptions('appraisal_cycle_types'));
  const { t } = useLocalization();
  return (
    <>
      <Field label={t('appraisal.actionSheet.fields.cycleName.label', 'Cycle name')}><Input value={String(form.name)} onChange={event => update('name', event.target.value)} required /></Field>
      <Field label={t('appraisal.actionSheet.fields.description.label', 'Description')}><Textarea value={String(form.description)} onChange={event => update('description', event.target.value)} className="min-h-24" /></Field>
      <Field label={t('appraisal.actionSheet.fields.reviewType.label', 'Review type')}>
        <Select value={String(form.reviewType)} onValueChange={value => update('reviewType', value)}>
          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
          <SelectContent>{cycleTypes.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('appraisal.actionSheet.fields.reviewStart.label', 'Review period starts')}><Input type="date" value={String(form.startDate)} onChange={event => update('startDate', event.target.value)} required /></Field>
        <Field label={t('appraisal.actionSheet.fields.reviewEnd.label', 'Review period ends')}><Input type="date" value={String(form.endDate)} onChange={event => update('endDate', event.target.value)} required /></Field>
        <Field label={t('appraisal.actionSheet.fields.selfAssessmentDue.label', 'Self-assessment due')}><Input type="date" value={String(form.selfDueDate)} onChange={event => update('selfDueDate', event.target.value)} required /></Field>
        <Field label={t('appraisal.actionSheet.fields.managerReviewDue.label', 'Manager review due')}><Input type="date" value={String(form.managerDueDate)} onChange={event => update('managerDueDate', event.target.value)} required /></Field>
        <Field label={t('appraisal.actionSheet.fields.resultReleaseDate.label', 'Result release date')}><Input type="date" value={String(form.releaseDate)} onChange={event => update('releaseDate', event.target.value)} /></Field>
      </div>
      <Field label={t('appraisal.actionSheet.fields.reviewTemplate.label', 'Review template')}>
        <Select value={String(form.templateVersionId)} onValueChange={value => update('templateVersionId', value)}>
          <SelectTrigger className="h-11"><SelectValue placeholder={t('appraisal.actionSheet.placeholders.selectTemplate', 'Select a published template')} /></SelectTrigger>
          <SelectContent>{data.templates.map(item => <SelectItem key={String(item.versionId)} value={String(item.versionId)}>{String(item.name)} - v{String(item.version)}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label={t('appraisal.actionSheet.fields.ratingModel.label', 'Rating model')}>
        <Select value={String(form.ratingModelId)} onValueChange={value => update('ratingModelId', value)}>
          <SelectTrigger className="h-11"><SelectValue placeholder={t('appraisal.actionSheet.placeholders.selectRatingModel', 'Select a rating model')} /></SelectTrigger>
          <SelectContent>{data.ratingModels.map(item => <SelectItem key={String(item.id)} value={String(item.id)}>{String(item.name)}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex min-h-12 items-center gap-3 border border-slate-200 px-3 text-sm dark:border-slate-800"><input type="checkbox" checked={Boolean(form.requirePeerReview)} onChange={event => update('requirePeerReview', event.target.checked)} />{t('appraisal.actionSheet.fields.requirePeerReview.label', 'Require peer review')}</label>
        <label className="flex min-h-12 items-center gap-3 border border-slate-200 px-3 text-sm dark:border-slate-800"><input type="checkbox" checked={Boolean(form.requireCalibration)} onChange={event => update('requireCalibration', event.target.checked)} />{t('appraisal.actionSheet.fields.requireCalibration.label', 'Require calibration')}</label>
      </div>
    </>
  );
}

function TemplateFields({ form, update }: FieldsProps) {
  const { t } = useLocalization();
  return (
    <>
      <Field label={t('appraisal.actionSheet.fields.templateName.label', 'Template name')}><Input value={String(form.name)} onChange={event => update('name', event.target.value)} required /></Field>
      <Field label={t('appraisal.actionSheet.fields.description.label', 'Description')}><Textarea value={String(form.description)} onChange={event => update('description', event.target.value)} className="min-h-24" /></Field>
      <div className="border border-[#d8c8af] bg-[#fbf7ef] p-4 text-sm leading-6 text-[#5e4a33] dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
        {t('appraisal.actionSheet.template.descriptionHelp', 'The first version includes review context, Goal evaluation, competency evaluation, achievement summary, strengths, development areas, overall rating, and acknowledgment. Create a new version for later structural changes.')}
      </div>
    </>
  );
}

function StageFields({ form, update }: FieldsProps) {
  const { t } = useLocalization();
  return (
    <>
      <Field label={t('appraisal.actionSheet.fields.newCycleStage.label', 'New cycle stage')}>
        <Select value={String(form.status)} onValueChange={value => update('status', value)}>
          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
          <SelectContent>{['preparing', 'scheduled', 'self_assessment', 'manager_review', 'peer_review', 'calibration', 'final_approval', 'ready_for_release', 'released', 'closed', 'cancelled', 'archived'].map(value => <SelectItem key={value} value={value}>{label(value, t)}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label={t('appraisal.actionSheet.fields.reason.label', 'Reason')}><Textarea value={String(form.reason)} onChange={event => update('reason', event.target.value)} className="min-h-28" required /></Field>
    </>
  );
}

function OverrideFields({ form, update }: FieldsProps) {
  const { t } = useLocalization();
  return (
    <>
      <Field label={t('appraisal.actionSheet.fields.newRating.label', 'New rating')}><Input type="number" min="0" max="100" step="0.1" value={String(form.newRating)} onChange={event => update('newRating', event.target.value)} required /></Field>
      <Field label={t('appraisal.actionSheet.fields.overrideReason.label', 'Override reason')}><Textarea value={String(form.reason)} onChange={event => update('reason', event.target.value)} className="min-h-24" required /></Field>
      <Field label={t('appraisal.actionSheet.fields.supportingComment.label', 'Supporting comment')}><Textarea value={String(form.comment)} onChange={event => update('comment', event.target.value)} className="min-h-24" required /></Field>
    </>
  );
}

function CalibrationFields({ form, update, record }: FieldsProps) {
  const { t } = useLocalization();
  return (
    <>
      <div className="grid grid-cols-3 gap-2 border-y border-slate-200 py-4 text-center dark:border-slate-800">
        <RatingFact label={t('appraisal.actionSheet.labels.calculated', 'Calculated')} value={record?.calculatedRating} />
        <RatingFact label={t('appraisal.actionSheet.labels.manager', 'Manager')} value={record?.managerRating} />
        <RatingFact label={t('appraisal.actionSheet.labels.previous', 'Previous')} value={record?.rating} />
      </div>
      <Field label={t('appraisal.actionSheet.fields.calibratedRating.label', 'Calibrated rating')}><Input type="number" min="0" max="100" step="0.1" value={String(form.calibratedRating)} onChange={event => update('calibratedRating', event.target.value)} required /></Field>
      <Field label={t('appraisal.actionSheet.fields.decision.label', 'Decision')}>
        <Select value={String(form.decision)} onValueChange={value => update('decision', value)}>
          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
          <SelectContent>{['confirmed', 'adjusted', 'returned', 'additional_information'].map(value => <SelectItem key={value} value={value}>{label(value, t)}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label={t('appraisal.actionSheet.fields.calibrationNotes.label', 'Calibration notes')}><Textarea value={String(form.notes)} onChange={event => update('notes', event.target.value)} className="min-h-32" required /></Field>
    </>
  );
}

function ApprovalFields({ form, update }: FieldsProps) {
  const { t } = useLocalization();
  return (
    <>
      <Field label={t('appraisal.actionSheet.fields.decision.label', 'Decision')}>
        <Select value={String(form.decision)} onValueChange={value => update('decision', value)}>
          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
          <SelectContent>{['approved', 'returned', 'rejected'].map(value => <SelectItem key={value} value={value}>{label(value, t)}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label={t('appraisal.actionSheet.fields.decisionComment.label', 'Decision comment')}><Textarea value={String(form.comment)} onChange={event => update('comment', event.target.value)} className="min-h-28" required /></Field>
    </>
  );
}

function AcknowledgmentFields({ form, update }: FieldsProps) {
  const { t } = useLocalization();
  return (
    <>
      <div className="border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
        {t('appraisal.actionSheet.acknowledge.helper', 'By confirming, you acknowledge that you received and reviewed the appraisal. This is not a statement of agreement.')}
      </div>
      <Field label={t('appraisal.actionSheet.fields.acknowledgmentComment.label', 'Acknowledgment comment')}><Textarea value={String(form.comment)} onChange={event => update('comment', event.target.value)} className="min-h-28" /></Field>
      <label className="flex min-h-12 items-center gap-3 border border-slate-200 px-3 text-sm dark:border-slate-800"><input type="checkbox" checked={Boolean(form.requestDiscussion)} onChange={event => update('requestDiscussion', event.target.checked)} />{t('appraisal.actionSheet.fields.requestDiscussion.label', 'Request a follow-up discussion instead')}</label>
    </>
  );
}

function AppealFields({ form, update }: FieldsProps) {
  const { t } = useLocalization();
  return <Field label={t('appraisal.actionSheet.fields.appealReason.label', 'Reason for appeal')} hint={t('appraisal.actionSheet.fields.appealReason.hint', 'Be specific about the result, evidence, or process you want HR to review.')}><Textarea value={String(form.reason)} onChange={event => update('reason', event.target.value)} className="min-h-40" required /></Field>;
}

function ReviewerFields({ form, update, data }: FieldsProps & { data: AppraisalWorkspaceData }) {
  const reviewerRelationships = useDropdownOptions('appraisal_reviewer_relationships', defaultDropdownOptions('appraisal_reviewer_relationships'));
  const { t } = useLocalization();
  const candidates = uniqueEmployees(data.teamReviews);
  return (
    <>
      <Field label={t('appraisal.actionSheet.fields.reviewer.label', 'Reviewer')}>
        <Select value={String(form.reviewerId)} onValueChange={value => update('reviewerId', value)}>
          <SelectTrigger className="h-11"><SelectValue placeholder={t('appraisal.actionSheet.placeholders.selectReviewer', 'Select an employee')} /></SelectTrigger>
          <SelectContent>{candidates.map(item => <SelectItem key={item.id} value={item.id}><EmployeeOption name={item.name} /></SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label={t('appraisal.actionSheet.fields.reviewerRole.label', 'Reviewer role')}>
        <Select value={String(form.reviewerRole)} onValueChange={value => update('reviewerRole', value)}>
          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
          <SelectContent>{reviewerRelationships.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('appraisal.actionSheet.fields.dueDate.label', 'Due date')}><Input type="date" value={String(form.dueDate)} onChange={event => update('dueDate', event.target.value)} required /></Field>
        <Field label={t('appraisal.actionSheet.fields.ratingWeight.label', 'Rating weight')}><Input type="number" min="0" max="100" value={String(form.weight)} onChange={event => update('weight', event.target.value)} /></Field>
      </div>
      <label className="flex min-h-12 items-center gap-3 border border-slate-200 px-3 text-sm dark:border-slate-800"><input type="checkbox" checked={Boolean(form.isAnonymous)} onChange={event => update('isAnonymous', event.target.checked)} />{t('appraisal.actionSheet.fields.protectReviewerIdentity.label', 'Protect reviewer identity from the employee')}</label>
    </>
  );
}

function Confirmation({ mode }: { mode: AppraisalActionMode }) {
  const { t } = useLocalization();
  const text: Partial<Record<AppraisalActionMode, string>> = {
    'submit-self': t('appraisal.actionSheet.confirmation.submitSelf', 'Your completed self-assessment will become read-only while the manager review is in progress.'),
    'submit-manager': t('appraisal.actionSheet.confirmation.submitManager', 'The review will move to calibration or final approval according to the cycle configuration.'),
    'generate-population': t('appraisal.actionSheet.confirmation.generatePopulation', 'Only eligible employees with managers are generated. Existing cycle records are never duplicated.'),
    calculate: t('appraisal.actionSheet.confirmation.calculate', 'The calculation preserves manager, calibrated, and final ratings as separate values.'),
    release: t('appraisal.actionSheet.confirmation.release', 'After release, the employee can see the final rating and will receive an acknowledgment request.'),
  };
  return <div className="border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">{text[mode]}</div>;
}

function RatingFact({ label: factLabel, value }: { label: string; value: unknown }) {
  const { t } = useLocalization();
  return <div><p className="text-xs text-slate-500">{factLabel}</p><p className="mt-1 text-lg font-bold tabular-nums">{value == null ? t('appraisal.actionSheet.fallback.noValue', 'No value') : Number(value).toFixed(1)}</p></div>;
}

function initialForm(mode: AppraisalActionMode, record: Record<string, unknown> | null, data: AppraisalWorkspaceData, t: Translate): FormState {
  const today = new Date();
  const year = today.getFullYear();
  const defaults: FormState = {
    summary: String(record?.selfAssessment || ''),
    strengths: String(record?.strengths || ''),
    developmentAreas: String(record?.developmentAreas || ''),
    careerAspiration: String(record?.careerAspiration || ''),
    developmentRecommendation: String(record?.developmentRecommendation || ''),
    comments: String(record?.managerComments || ''),
    rating: String(record?.managerRating || ''),
    name: mode === 'create-template' ? t('appraisal.actionSheet.defaults.templateName', 'Balanced contribution review') : t('appraisal.actionSheet.defaults.annualReviewName', `${year} Annual Performance Review`),
    description: '',
    reviewType: 'annual',
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    selfDueDate: `${year}-11-15`,
    managerDueDate: `${year}-11-30`,
    releaseDate: `${year}-12-15`,
    templateVersionId: String(data.templates[0]?.versionId || ''),
    ratingModelId: String(data.ratingModels[0]?.id || ''),
    requirePeerReview: false,
    requireCalibration: true,
    status: 'self_assessment',
    reason: '',
    comment: '',
    newRating: String(record?.calibratedRating ?? record?.managerRating ?? record?.calculatedRating ?? ''),
    calibratedRating: String(record?.managerRating ?? record?.calculatedRating ?? ''),
    decision: mode === 'approve' ? 'approved' : 'confirmed',
    notes: '',
    requestDiscussion: false,
    reviewerId: '',
    reviewerRole: 'peer',
    dueDate: String(record?.managerDueDate || '').slice(0, 10) || `${year}-11-30`,
    weight: '0',
    isAnonymous: true,
  };
  for (const goal of arrayValue(record?.goals)) defaults[`goal:${String(goal.id)}`] = '';
  return defaults;
}

function buildPayload(
  mode: AppraisalActionMode,
  form: FormState,
  record: Record<string, unknown> | null,
  data: AppraisalWorkspaceData,
  t: Translate,
) {
  const idempotencyKey = crypto.randomUUID();
  const reviewId = String(record?.id || '');
  const expectedVersion = Number(record?.version || 1);
  const goalEvaluations = arrayValue(record?.goals)
    .filter(goal => String(form[`goal:${String(goal.id)}`] || '').trim())
    .map(goal => ({ itemId: String(goal.id), rating: Number(form[`goal:${String(goal.id)}`]), comment: null, evidence: [] }));
  const base = { reviewId, expectedVersion };
  if (mode === 'self') return {
    body: { action: 'save_self_assessment', ...base, responses: { achievementSummary: form.summary }, summary: form.summary, strengths: form.strengths || null, developmentAreas: form.developmentAreas || null, careerAspiration: form.careerAspiration || null, goalEvaluations, competencyEvaluations: [] },
    message: t('appraisal.actionSheet.messages.selfDraftSaved', 'Self-assessment draft saved.'),
  };
  if (mode === 'submit-self') return { body: { action: 'submit_self_assessment', ...base }, message: t('appraisal.actionSheet.messages.selfSubmitted', 'Self-assessment submitted.') };
  if (mode === 'manager') return {
    body: { action: 'save_manager_assessment', ...base, rating: Number(form.rating), comments: form.comments, strengths: form.strengths || null, developmentAreas: form.developmentAreas || null, developmentRecommendation: form.developmentRecommendation || null, goalEvaluations, competencyEvaluations: [] },
    message: t('appraisal.actionSheet.messages.managerDraftSaved', 'Manager assessment draft saved.'),
  };
  if (mode === 'submit-manager') return { body: { action: 'submit_manager_assessment', ...base }, message: t('appraisal.actionSheet.messages.managerSubmitted', 'Manager assessment submitted.') };
  if (mode === 'peer') return { body: { action: 'submit_peer_review', assignmentId: String(record?.id), rating: Number(form.rating), strengths: form.strengths, developmentAreas: form.developmentAreas, comments: form.comments || null, responses: {}, expectedVersion }, message: t('appraisal.actionSheet.messages.peerFeedback', 'Review feedback submitted.') };
  if (mode === 'create-cycle') {
    if (!form.templateVersionId || !form.ratingModelId) throw new Error(t('appraisal.actionSheet.errors.templateAndModelRequired', 'Create or select a published template and rating model first.'));
    return {
      body: { action: 'create_cycle', name: form.name, description: form.description || null, reviewType: form.reviewType, startDate: form.startDate, endDate: form.endDate, selfDueDate: form.selfDueDate, managerDueDate: form.managerDueDate, releaseDate: form.releaseDate || null, templateVersionId: form.templateVersionId, ratingModelId: form.ratingModelId, population: { companyId: null, departmentIds: [], employeeIds: [], excludedEmployeeIds: [], employmentStatuses: ['active'] }, requirePeerReview: form.requirePeerReview, requireCalibration: form.requireCalibration, idempotencyKey },
      message: t('appraisal.actionSheet.messages.cycleDraftCreated', 'Draft appraisal cycle created.'),
    };
  }
  if (mode === 'create-template') return {
    body: {
      action: 'create_template', name: form.name, description: form.description || null, idempotencyKey,
      sections: [
        { key: 'context', title: t('appraisal.actionSheet.template.sections.context', 'Review context'), type: 'information', required: false, weight: 0, visibleTo: ['self', 'manager', 'hr'], editableBy: ['hr'] },
        { key: 'goals', title: t('appraisal.actionSheet.template.sections.goals', 'Goal achievement'), type: 'goal', required: true, weight: 40, visibleTo: ['self', 'manager', 'hr'], editableBy: ['self', 'manager'] },
        { key: 'competencies', title: t('appraisal.actionSheet.template.sections.competencies', 'Competency assessment'), type: 'competency', required: true, weight: 30, visibleTo: ['self', 'manager', 'peer', 'hr'], editableBy: ['self', 'manager', 'peer'] },
        { key: 'summary', title: t('appraisal.actionSheet.template.sections.summary', 'Achievement summary'), type: 'text', required: true, weight: 0, visibleTo: ['self', 'manager', 'hr'], editableBy: ['self', 'manager'] },
        { key: 'overall', title: t('appraisal.actionSheet.template.sections.overall', 'Overall rating'), type: 'rating', required: true, weight: 30, visibleTo: ['manager', 'hr'], editableBy: ['manager', 'hr'] },
        { key: 'acknowledgment', title: t('appraisal.actionSheet.template.sections.acknowledgment', 'Employee acknowledgment'), type: 'acknowledgment', required: true, weight: 0, visibleTo: ['self', 'hr'], editableBy: ['self'] },
      ],
    },
    message: t('appraisal.actionSheet.messages.templatePublished', 'Review template published.'),
  };
  if (mode === 'generate-population') return { body: { action: 'generate_population', cycleId: String(record?.id), expectedVersion, idempotencyKey }, message: t('appraisal.actionSheet.messages.recordsGenerated', 'Eligible appraisal records generated.') };
  if (mode === 'stage') return { body: { action: 'change_cycle_stage', cycleId: String(record?.id), status: form.status, reason: form.reason, expectedVersion }, message: t('appraisal.actionSheet.messages.stageChanged', 'Cycle stage changed.') };
  if (mode === 'calculate') return { body: { action: 'calculate_rating', ...base }, message: t('appraisal.actionSheet.messages.ratingCalculated', 'Rating calculated from configured weights.') };
  if (mode === 'override') return { body: { action: 'override_rating', ...base, newRating: Number(form.newRating), reason: form.reason, comment: form.comment }, message: t('appraisal.actionSheet.messages.overrideRecorded', 'Rating override recorded.') };
  if (mode === 'calibrate') return { body: { action: 'calibrate_rating', ...base, calibratedRating: Number(form.calibratedRating), decision: form.decision, notes: form.notes }, message: t('appraisal.actionSheet.messages.calibrationSaved', 'Calibration decision saved.') };
  if (mode === 'approve') return { body: { action: 'approval_decision', ...base, decision: form.decision, comment: form.comment }, message: t('appraisal.actionSheet.messages.approvalRecorded', 'Approval decision recorded.') };
  if (mode === 'release') return { body: { action: 'release_result', ...base, idempotencyKey }, message: t('appraisal.actionSheet.messages.released', 'Appraisal released to employee.') };
  if (mode === 'acknowledge') return { body: { action: 'acknowledge_result', ...base, comment: form.comment || null, requestDiscussion: form.requestDiscussion }, message: form.requestDiscussion ? t('appraisal.actionSheet.messages.discussionRequested', 'Discussion requested.') : t('appraisal.actionSheet.messages.receiptAcknowledged', 'Appraisal receipt acknowledged.') };
  if (mode === 'appeal') return { body: { action: 'submit_appeal', ...base, reason: form.reason, evidence: [] }, message: t('appraisal.actionSheet.messages.appealSubmitted', 'Appeal submitted to HR.') };
  if (mode === 'assign-reviewer') return { body: { action: 'assign_reviewer', ...base, reviewerId: form.reviewerId, reviewerRole: form.reviewerRole, dueDate: form.dueDate, weight: Number(form.weight || 0), isAnonymous: form.isAnonymous, isRequired: true, idempotencyKey }, message: t('appraisal.actionSheet.messages.reviewerAssigned', 'Reviewer assigned.') };
  throw new Error(`${t('appraisal.actionSheet.errors.unsupportedAction', 'Unsupported appraisal action:')} ${mode}`);
}

function arrayValue(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value as Array<Record<string, unknown>>;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function uniqueEmployees(rows: Array<Record<string, unknown>>) {
  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.employeeId && row.employeeName) map.set(String(row.employeeId), String(row.employeeName));
  }
  return [...map].map(([id, name]) => ({ id, name }));
}

function label(value: string, t: Translate) {
  return t(`appraisal.actionSheet.labels.${value.replace(/_/g, '-')}`, value.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase()));
}






