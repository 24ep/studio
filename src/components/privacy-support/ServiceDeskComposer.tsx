"use client";

import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, CircleHelp, FilePlus2, Loader2, Send, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  type ServiceDeskIntent,
  type SupportCreateInput,
  supportCreateSchema,
} from '@/lib/service-desk-contract';
import { useServiceDeskCategories } from '@/hooks/use-service-desk-categories';

type Translate = (key: string, fallback?: string) => string;
type FieldErrors = Partial<Record<'category' | 'subject' | 'description', string>>;

export function ServiceDeskComposer({
  intent,
  saving,
  error,
  t,
  onCancel,
  onSubmit,
}: {
  intent: ServiceDeskIntent;
  saving: boolean;
  error?: string;
  t: Translate;
  onCancel: () => void;
  onSubmit: (input: SupportCreateInput) => Promise<boolean>;
}) {
  const categories = useServiceDeskCategories();
  const [category, setCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!categories.some(option => option.key === category)) {
      setCategory(categories[0]?.key || '');
    }
  }, [categories, category]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = supportCreateSchema.safeParse({
      category,
      subject,
      description,
      metadata: { intent, source: 'service-desk-page' },
    });
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      setErrors({
        category: fields.category?.[0],
        subject: fields.subject?.[0],
        description: fields.description?.[0],
      });
      return;
    }
    setErrors({});
    await onSubmit(result.data);
  }

  const isQuestion = intent === 'question';
  const title = isQuestion
    ? t('serviceDesk.compose.questionTitle', 'Ask the People team')
    : t('serviceDesk.compose.requestTitle', 'Create a support request');

  return (
    <div className="flex min-h-[620px] min-w-0 flex-1 flex-col bg-background">
      <header className="border-b border-border bg-card px-4 py-4 sm:px-6">
        <button type="button" onClick={onCancel} className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('serviceDesk.backToTickets', 'Back to tickets')}
        </button>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            {isQuestion ? <CircleHelp className="h-5 w-5" /> : <FilePlus2 className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">{t('serviceDesk.peopleTeam', 'People team')}</p>
            <h1 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-foreground">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t('serviceDesk.compose.intro', 'Share the context once. Your request and every reply stay together in a private, traceable conversation.')}
            </p>
          </div>
        </div>
      </header>

      <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_280px]">
        <form onSubmit={submit} noValidate className="min-w-0 space-y-6 px-4 py-6 sm:px-8 sm:py-8">
          {error && <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-950 dark:bg-red-950/30 dark:text-red-200">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="service-desk-category" className="text-sm">{t('serviceDesk.compose.category', 'What can we help with?')}</Label>
            <select
              id="service-desk-category"
              value={category}
              onChange={event => setCategory(event.target.value)}
              disabled={saving || categories.length === 0}
              aria-invalid={Boolean(errors.category)}
              aria-describedby={errors.category ? 'service-desk-category-error' : undefined}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {categories.length === 0 && <option value="">No request categories are currently available</option>}
              {categories.map(option => (
                <option key={option.key} value={option.key}>{t(`serviceDesk.category.${option.key}`, option.label)}</option>
              ))}
            </select>
            {errors.category && <p id="service-desk-category-error" className="text-xs text-red-700 dark:text-red-300">{errors.category}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-end justify-between gap-3">
              <Label htmlFor="service-desk-subject" className="text-sm">{t('serviceDesk.compose.subject', 'Subject')}</Label>
              <span className="text-[11px] tabular-nums text-muted-foreground">{subject.length}/160</span>
            </div>
            <Input
              id="service-desk-subject"
              value={subject}
              onChange={event => setSubject(event.target.value)}
              autoFocus
              maxLength={160}
              aria-invalid={Boolean(errors.subject)}
              aria-describedby={errors.subject ? 'service-desk-subject-error' : 'service-desk-subject-hint'}
              placeholder={t('serviceDesk.compose.subjectPlaceholder', 'A short summary of what you need')}
              className="h-11 bg-background text-sm"
            />
            <p id="service-desk-subject-hint" className="text-xs text-muted-foreground">{t('serviceDesk.compose.subjectHint', 'Use a specific title so the team can route your request quickly.')}</p>
            {errors.subject && <p id="service-desk-subject-error" className="text-xs text-red-700 dark:text-red-300">{errors.subject}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-end justify-between gap-3">
              <Label htmlFor="service-desk-description" className="text-sm">{t('serviceDesk.compose.details', 'Details')}</Label>
              <span className="text-[11px] tabular-nums text-muted-foreground">{description.length}/5000</span>
            </div>
            <Textarea
              id="service-desk-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              maxLength={5000}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'service-desk-description-error' : 'service-desk-description-hint'}
              placeholder={t('serviceDesk.compose.detailsPlaceholder', 'Include relevant dates, what you expected, and what happened instead.')}
              className="min-h-48 resize-y bg-background text-sm leading-6"
            />
            <p id="service-desk-description-hint" className="text-xs text-muted-foreground">{t('serviceDesk.compose.detailsHint', 'Please avoid passwords, bank details, government IDs, or other secrets.')}</p>
            {errors.description && <p id="service-desk-description-error" className="text-xs text-red-700 dark:text-red-300">{errors.description}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
            <Button type="submit" disabled={saving || categories.length === 0} className="min-w-36">
              {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Send className="me-2 h-4 w-4" />}
              {saving ? t('serviceDesk.compose.sending', 'Sending…') : t('serviceDesk.compose.send', 'Send request')}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>{t('common.cancel', 'Cancel')}</Button>
          </div>
        </form>

        <aside className="border-t border-border bg-muted/35 px-6 py-7 lg:border-s lg:border-t-0">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="mt-4 text-sm font-semibold">{t('serviceDesk.compose.privateTitle', 'Private by design')}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('serviceDesk.compose.privateBody', 'Only you and authorized HR administrators can read this conversation. Every change is retained in the activity history.')}</p>
          <ol className="mt-7 space-y-5 text-sm">
            <li className="flex gap-3"><span className="font-semibold text-primary">01</span><span>{t('serviceDesk.compose.stepOne', 'Submit the request')}</span></li>
            <li className="flex gap-3"><span className="font-semibold text-primary">02</span><span>{t('serviceDesk.compose.stepTwo', 'HR reviews and replies')}</span></li>
            <li className="flex gap-3"><span className="font-semibold text-primary">03</span><span>{t('serviceDesk.compose.stepThree', 'Continue in one history')}</span></li>
          </ol>
        </aside>
      </div>
    </div>
  );
}
