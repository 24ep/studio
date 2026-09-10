"use client";

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  MapIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type OutputType = 'course' | 'path';
type GenerationResult = { type: OutputType; id: string; title: string; courseCount: number };

const MAX_FILES = 5;
const acceptedExtensions = ['pdf', 'docx', 'txt', 'md'];

export function AiLearningBuilderDialog({
  open,
  onOpenChange,
  initialType,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialType: OutputType;
  onCreated: () => void;
}) {
  const [outputType, setOutputType] = React.useState<OutputType>(initialType);
  const [stage, setStage] = React.useState<'choose' | 'configure'>('choose');
  const [files, setFiles] = React.useState<File[]>([]);
  const [goal, setGoal] = React.useState('');
  const [audience, setAudience] = React.useState('All employees');
  const [difficulty, setDifficulty] = React.useState('Foundational');
  const [isDragging, setIsDragging] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState<GenerationResult | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open && !isGenerating && !result) {
      setOutputType(initialType);
      setStage('choose');
    }
  }, [initialType, isGenerating, open, result]);

  const addFiles = (incoming: File[]) => {
    setError('');
    const supported = incoming.filter(file => acceptedExtensions.includes(file.name.split('.').pop()?.toLowerCase() || ''));
    if (supported.length !== incoming.length) setError('Some files were skipped. Use PDF, DOCX, TXT, or Markdown.');
    setFiles(current => {
      const names = new Set(current.map(file => `${file.name}:${file.size}`));
      return [...current, ...supported.filter(file => !names.has(`${file.name}:${file.size}`))].slice(0, MAX_FILES);
    });
  };

  const generate = async () => {
    if (!files.length || !goal.trim()) {
      setError(!files.length ? 'Add at least one source document.' : 'Describe the learning outcome.');
      return;
    }
    setIsGenerating(true);
    setError('');
    try {
      const form = new FormData();
      form.set('outputType', outputType);
      form.set('goal', goal);
      form.set('audience', audience);
      form.set('difficulty', difficulty);
      files.forEach(file => form.append('files', file));
      const response = await fetch('/api/learning/generate', { method: 'POST', credentials: 'include', body: form });
      const payload = await response.json() as { data?: GenerationResult; message?: string };
      if (!response.ok || !payload.data) throw new Error(payload.message || 'AI could not create this learning draft.');
      setResult(payload.data);
      onCreated();
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'AI could not create this learning draft.');
    } finally {
      setIsGenerating(false);
    }
  };

  const close = (nextOpen: boolean) => {
    if (isGenerating) return;
    onOpenChange(nextOpen);
    if (!nextOpen) window.setTimeout(() => {
      setFiles([]);
      setGoal('');
      setAudience('All employees');
      setDifficulty('Foundational');
      setStage('choose');
      setResult(null);
      setError('');
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto border-0 p-0 sm:max-w-[760px]">
        <div className="grid md:min-h-[610px] md:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="relative overflow-hidden bg-[#173f37] px-6 py-6 text-[#f3f6e9] md:py-8">
            <div className="absolute -right-16 -top-14 h-44 w-44 rounded-full border border-[#d9ef95]/25" />
            <div className="absolute -right-6 top-10 h-24 w-24 rounded-full border border-[#d9ef95]/20" />
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#d9ef95] text-[#173f37]"><SparklesIcon className="h-5 w-5" /></span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[.15em] text-[#bed0c4] md:mt-8">AI learning builder</p>
            <h2 className="mt-2 max-w-sm text-xl font-bold leading-tight tracking-[-.035em] md:mt-3 md:text-2xl">From source material to a teachable journey.</h2>
            <ol className="mt-10 hidden space-y-5 text-sm md:block">
              {['Choose the format', 'Add trusted sources', 'Set the learning intent', 'Review the editable draft'].map((label, index) => {
                const complete = Boolean(result) || (stage === 'configure' && index === 0) || (isGenerating && index < 3);
                return <li key={label} className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full border border-[#d9ef95]/45 text-xs font-bold">{complete ? <CheckCircleIcon className="h-4 w-4" /> : index + 1}</span><span>{label}</span></li>;
              })}
            </ol>
            <p className="absolute bottom-7 left-6 right-6 hidden text-xs leading-5 text-[#bed0c4] md:block">AI creates a draft. Your learning team keeps final editorial and publishing control.</p>
          </aside>

          <div className="flex min-w-0 flex-col bg-[#fbfcf8] p-6 text-slate-950 dark:bg-zinc-950 dark:text-zinc-50 sm:p-8">
            {result ? (
              <div className="flex flex-1 flex-col justify-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><CheckCircleIcon className="h-7 w-7" /></span>
                <p className="mt-7 text-xs font-bold uppercase tracking-[.15em] text-emerald-700 dark:text-emerald-300">Draft ready</p>
                <h3 className="mt-2 text-3xl font-bold tracking-[-.04em]">{result.title}</h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-zinc-300">{result.type === 'path' ? `${result.courseCount} editable course drafts were sequenced into this learning path.` : 'The curriculum, lessons, teaching content, and knowledge checks are ready for review.'}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild className="bg-[#316be8] hover:bg-[#285dce]">
                    <Link href={result.type === 'course' ? `/learning/courses/${result.id}/studio` : '/learning/paths'}>{result.type === 'course' ? 'Review in course studio' : 'View learning path'}<ArrowRightIcon className="ml-2 h-4 w-4" /></Link>
                  </Button>
                  <Button variant="outline" onClick={() => close(false)}>Close</Button>
                </div>
              </div>
            ) : isGenerating ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center" role="status">
                <div className="relative grid h-24 w-24 place-items-center">
                  <span className="absolute inset-0 animate-spin rounded-full border-2 border-slate-200 border-t-[#316be8] motion-reduce:animate-none dark:border-zinc-800 dark:border-t-blue-400" />
                  <DocumentTextIcon className="h-9 w-9 text-[#316be8]" />
                </div>
                <h3 className="mt-7 text-2xl font-bold tracking-[-.03em]">Building the learning arc</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-zinc-400">Reading {files.length} source{files.length === 1 ? '' : 's'}, finding teachable ideas, and writing an editable {outputType} draft.</p>
              </div>
            ) : stage === 'choose' ? (
              <div className="flex flex-1 flex-col">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-2xl tracking-[-.03em]">What would you like to create?</DialogTitle>
                  <DialogDescription>Choose the learning format first. You’ll add source documents and goals in the next step.</DialogDescription>
                </DialogHeader>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => { setOutputType('course'); setStage('configure'); }}
                    className="group flex min-h-56 flex-col rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#316be8] hover:shadow-[0_12px_32px_rgba(49,107,232,.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#316be8] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-[#316be8]"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-[#316be8] dark:bg-blue-950/50"><BookOpenIcon className="h-6 w-6" /></span>
                    <span className="mt-6 text-lg font-bold tracking-[-.025em]">Single course</span>
                    <span className="mt-2 text-sm leading-6 text-slate-500 dark:text-zinc-400">Create one focused course with modules, lessons, activities, and knowledge checks.</span>
                    <span className="mt-auto inline-flex items-center pt-6 text-sm font-semibold text-[#316be8]">Create a course<ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOutputType('path'); setStage('configure'); }}
                    className="group flex min-h-56 flex-col rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#316be8] hover:shadow-[0_12px_32px_rgba(49,107,232,.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#316be8] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-[#316be8]"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300"><MapIcon className="h-6 w-6" /></span>
                    <span className="mt-6 text-lg font-bold tracking-[-.025em]">Learning path</span>
                    <span className="mt-2 text-sm leading-6 text-slate-500 dark:text-zinc-400">Build a sequenced journey containing multiple editable courses and milestones.</span>
                    <span className="mt-auto inline-flex items-center pt-6 text-sm font-semibold text-[#316be8]">Create a path<ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                  </button>
                </div>

                <p className="mt-auto pt-8 text-xs leading-5 text-slate-500 dark:text-zinc-400">Both formats are generated as unpublished drafts so your learning team can review and edit them before release.</p>
              </div>
            ) : (
              <>
                <DialogHeader className="text-left">
                  <button type="button" onClick={() => setStage('choose')} className="mb-3 inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#316be8] dark:text-zinc-400 dark:hover:text-blue-300"><ArrowLeftIcon className="h-4 w-4" />Change format</button>
                  <DialogTitle className="text-2xl tracking-[-.03em]">Create a {outputType === 'course' ? 'single course' : 'learning path'}</DialogTitle>
                  <DialogDescription>Choose the shape, then give AI grounded source material and a clear outcome.</DialogDescription>
                </DialogHeader>

                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragEnter={event => { event.preventDefault(); setIsDragging(true); }}
                  onDragOver={event => event.preventDefault()}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={event => { event.preventDefault(); setIsDragging(false); addFiles(Array.from(event.dataTransfer.files)); }}
                  className={cn('mt-5 flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed px-5 py-4 text-center transition-colors', isDragging ? 'border-[#316be8] bg-blue-50 dark:bg-blue-950/30' : 'border-slate-300 bg-white hover:border-slate-400 dark:border-zinc-700 dark:bg-zinc-900')}
                >
                  <DocumentTextIcon className="h-7 w-7 text-[#316be8]" />
                  <span className="mt-2 text-sm font-semibold">Drop source documents or browse</span>
                  <span className="mt-1 text-xs text-slate-500">PDF, DOCX, TXT, MD · up to 5 files · 10 MB each</span>
                </button>
                <input ref={inputRef} className="sr-only" type="file" multiple accept=".pdf,.docx,.txt,.md" onChange={event => addFiles(Array.from(event.target.files || []))} />

                {files.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{files.map((file, index) => <span key={`${file.name}-${file.size}`} className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#edf2f7] py-1.5 pl-3 pr-1.5 text-xs font-medium dark:bg-zinc-800"><span className="max-w-52 truncate">{file.name}</span><button type="button" className="rounded-full p-1 hover:bg-slate-200 dark:hover:bg-zinc-700" aria-label={`Remove ${file.name}`} onClick={() => setFiles(current => current.filter((_, itemIndex) => itemIndex !== index))}><TrashIcon className="h-3.5 w-3.5" /></button></span>)}</div>}

                <div className="mt-5 grid gap-4">
                  <div><Label htmlFor="ai-learning-goal">Learning outcome</Label><Textarea id="ai-learning-goal" value={goal} onChange={event => setGoal(event.target.value)} className="mt-2 min-h-20 bg-white dark:bg-zinc-900" placeholder="After this learning, employees should be able to…" /></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><Label htmlFor="ai-learning-audience">Audience</Label><Input id="ai-learning-audience" value={audience} onChange={event => setAudience(event.target.value)} className="mt-2 bg-white dark:bg-zinc-900" /></div>
                    <div><Label htmlFor="ai-learning-level">Level</Label><select id="ai-learning-level" value={difficulty} onChange={event => setDifficulty(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"><option>Foundational</option><option>Intermediate</option><option>Advanced</option></select></div>
                  </div>
                </div>

                {error && <p role="alert" className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">{error}</p>}
                <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                  <p className="text-xs text-slate-500">Generated as an unpublished draft</p>
                  <Button type="button" onClick={() => void generate()} className="bg-[#316be8] px-5 hover:bg-[#285dce]"><SparklesIcon className="mr-2 h-4 w-4" />Generate draft</Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
