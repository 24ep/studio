"use client";

import Link from 'next/link';
import Image from 'next/image';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Captions, Check, CheckCircle2, ChevronRight, ChevronUp, Clock3, Download, FileText, Flag, LockKeyhole, Maximize2, Menu, Pause, Play, RotateCcw, RotateCw, Save, ShieldCheck, Sparkles, Target, Upload, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useVisibilityInterval } from '@/hooks/use-visibility-interval';
import { AiAssignmentDialog } from './AiAssignmentDialog';

type Row = Record<string, any>;
type Detail = { course: Row; enrollment: Row | null; sections: Array<Row & { lessons: Array<Row & { blocks: Row[] }> }>; progress: Record<string, Row>; rules: Row; canManage?: boolean };

function minutes(seconds: number) {
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function CourseExperience({ courseId, player = false }: { courseId: string; player?: boolean }) {
  const router = useRouter();
  const [detail, setDetail] = React.useState<Detail | null>(null);
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = React.useState(false);
  const [selectedLessonId, setSelectedLessonId] = React.useState<string | null>(null);
  const [activeSeconds, setActiveSeconds] = React.useState(0);
  const load = React.useCallback(async () => {
    const response = await fetch(`/api/learning/courses/${courseId}`, { credentials: 'include' });
    const payload = await response.json();
    if (!response.ok) return setError(payload.message || 'Unable to load course');
    setDetail(payload.data);
    setSelectedLessonId(current => current || payload.data.enrollment?.current_lesson_id || payload.data.sections.flatMap((s: Row) => s.lessons)[0]?.id);
    setActiveSeconds(payload.data.enrollment?.active_seconds || 0);
  }, [courseId]);
  React.useEffect(() => { void load(); }, [load]);

  const start = async () => {
    setSaving(true);
    const response = await fetch(`/api/learning/courses/${courseId}`, { method: 'POST', credentials: 'include' });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) return setError(payload.message || 'Unable to start');
    router.push(`/learning/courses/${courseId}/learn`);
  };

  const lessons = detail?.sections.flatMap(section => section.lessons) || [];
  const selected = lessons.find(lesson => lesson.id === selectedLessonId) || lessons[0];
  const selectedIndex = lessons.findIndex(lesson => lesson.id === selected?.id);
  const progress = detail?.progress[selected?.id];
  const interactionAtRef = React.useRef(Date.now());
  const shouldTrackActiveProgress = player && !!detail?.enrollment && !!selected && progress?.status !== 'completed';

  React.useEffect(() => {
    if (!shouldTrackActiveProgress) return;
    interactionAtRef.current = Date.now();
    const active = () => { interactionAtRef.current = Date.now(); };
    window.addEventListener('pointerdown', active);
    window.addEventListener('keydown', active);
    return () => {
      window.removeEventListener('pointerdown', active);
      window.removeEventListener('keydown', active);
    };
  }, [shouldTrackActiveProgress]);

  const sendActiveHeartbeat = React.useCallback(() => {
    if (!shouldTrackActiveProgress || !detail?.enrollment || !selected) return;
    if (Date.now() - interactionAtRef.current > 60_000) return;
    setActiveSeconds(value => value + 15);
    void fetch('/api/learning/progress', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'heartbeat', enrollmentId: detail.enrollment.id, lessonId: selected.id, seconds: 15 }),
    });
  }, [detail?.enrollment?.id, selected?.id, shouldTrackActiveProgress]);

  useVisibilityInterval(sendActiveHeartbeat, 15_000, shouldTrackActiveProgress);

  if (error) return <main className="grid min-h-[70vh] place-items-center p-6"><div className="max-w-md text-center"><h1 className="text-xl font-semibold">Learning is unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p><Button asChild variant="outline" className="mt-5"><Link href="/learning/courses">Back to courses</Link></Button></div></main>;
  if (!detail) return <main className="min-h-[70vh] bg-[#f4f1e9] p-6 dark:bg-zinc-950"><div className="mx-auto max-w-6xl animate-pulse"><div className="h-4 w-36 rounded-full bg-[#d9d5c9] dark:bg-zinc-800" /><div className="mt-8 h-80 rounded-[28px] bg-[#e6e1d5] dark:bg-zinc-900" /></div></main>;
  if (player) return <CourseLessonPlayer detail={detail} courseId={courseId} lessons={lessons} selected={selected} selectedIndex={selectedIndex} progress={progress} activeSeconds={activeSeconds} menuOpen={menuOpen} onMenuOpenChange={setMenuOpen} onSelectLesson={setSelectedLessonId} onReload={load} />;

  const completed = lessons.filter(lesson => detail.progress[lesson.id]?.status === 'completed').length;
  const isDraft = detail.course.status !== 'published' || detail.course.version_status === 'draft';
  const lessonOptions = detail.sections.flatMap(section => section.lessons.map(lesson => ({ id: String(lesson.id), title: String(lesson.title), sectionTitle: String(section.title) })));
  const useProposedDesign = detail.course.experience_variant !== 'legacy';

  if (useProposedDesign) return (
    <CourseOverviewProposal
      detail={detail}
      courseId={courseId}
      lessons={lessons}
      completed={completed}
      isDraft={isDraft}
      saving={saving}
      lessonOptions={lessonOptions}
      assignmentDialogOpen={assignmentDialogOpen}
      onAssignmentDialogChange={setAssignmentDialogOpen}
      onStart={() => void start()}
      onReload={() => void load()}
    />
  );

  return (
    <main className="min-h-full w-full bg-[#f4f1e9] px-4 py-6 text-[#17251f] dark:bg-[#111613] dark:text-[#edf4ee] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1240px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/learning/courses" className="group inline-flex items-center gap-2 text-sm font-semibold text-[#506059] transition-colors hover:text-[#17251f] dark:text-[#aab8ae] dark:hover:text-white"><ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />All courses</Link>
          {detail.canManage && <Button type="button" variant="ghost" className="h-9 rounded-full px-4 text-[#315f50] hover:bg-[#e4e8da] dark:text-[#b9d5c8] dark:hover:bg-white/10" onClick={() => setAssignmentDialogOpen(true)}><Sparkles className="mr-2 h-4 w-4" />Create AI assignment</Button>}
        </div>
        <section className="relative mt-6 grid gap-8 overflow-hidden rounded-[28px] bg-[#173f35] p-7 text-[#f5f3e9] shadow-[0_24px_70px_rgba(28,48,39,0.16)] sm:p-10 lg:min-h-[390px] lg:grid-cols-[minmax(0,1fr)_340px] lg:p-12">
          <div className="pointer-events-none absolute -right-20 -top-48 h-[430px] w-[430px] rounded-full border-[72px] border-[#d8e06f]/80" aria-hidden="true" />
          <div className="relative flex flex-col justify-between"><div><div className="flex gap-2"><span className="text-xs font-bold uppercase tracking-[.18em] text-[#dce7dc]">{detail.course.category || 'General'}</span>{detail.course.is_required && <span className="rounded-full bg-[#f3d58a] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#423616]"><ShieldCheck className="mr-1 inline h-3.5 w-3.5" />Required</span>}</div><h1 className="mt-6 max-w-3xl text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[.96] tracking-[-.06em]">{detail.course.title}</h1><p className="mt-6 max-w-2xl text-base leading-7 text-[#d8e5de] sm:text-lg">{detail.course.description || 'A focused learning experience designed to help you put new skills into practice.'}</p></div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm font-semibold text-[#e9f0eb]"><span><Clock3 className="mr-2 inline h-4 w-4 text-[#d8e06f]" />{detail.course.duration_hours || 0} hours</span><span><BookOpen className="mr-2 inline h-4 w-4 text-[#d8e06f]" />{lessons.length} lessons</span><span><Target className="mr-2 inline h-4 w-4 text-[#d8e06f]" />Pass at {detail.rules.passingScore}%</span></div></div>
          <div className="relative self-end rounded-[22px] bg-[#f7f4e9] p-6 text-[#17251f] shadow-[0_18px_50px_rgba(7,28,22,.22)] sm:p-8"><div className="flex justify-between text-sm font-bold"><span className="uppercase tracking-[.14em] text-[#68766f]">{isDraft ? 'Draft preview' : detail.enrollment ? 'Welcome back' : 'Ready when you are'}</span>{!isDraft && <span className="text-3xl tracking-[-.05em] text-[#315f50]">{detail.enrollment?.progress || 0}%</span>}</div>{isDraft ? <p className="mt-5 text-sm leading-6 text-[#66736d]">Add curriculum in Studio, review the learner flow, then publish when it is ready for employees.</p> : <><Progress value={detail.enrollment?.progress || 0} className="mt-6 h-2.5 bg-[#dddccd] [&>div]:bg-[#ef765f]" /><p className="mt-3 text-sm text-[#66736d]">{completed} of {lessons.length} lessons complete</p></>}<p className="mt-8 flex items-center gap-2 text-xs font-semibold text-[#66736d]"><Flag className="h-4 w-4" />Your next step is saved automatically</p>{isDraft ? <Button asChild className="mt-4 h-12 w-full rounded-full bg-[#173f35] hover:bg-[#245648]"><Link href={`/learning/courses/${courseId}/studio`}>Open Course Studio<ChevronRight className="ml-2 h-4 w-4" /></Link></Button> : <Button className="mt-4 h-12 w-full rounded-full bg-[#173f35] hover:bg-[#245648]" onClick={start} disabled={saving}>{saving ? 'Opening…' : detail.enrollment ? 'Continue learning' : 'Start course'}<Play className="ml-2 h-4 w-4 fill-current" /></Button>}</div>
        </section>
        <section className="grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:py-14"><div><div className="flex items-end justify-between gap-4 border-b border-[#cfcfc2] pb-5 dark:border-white/15"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#68766f] dark:text-[#9eaaa2]">Course journey</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.045em]">What you’ll learn</h2></div><span className="hidden text-sm font-medium text-[#68766f] sm:block">{lessons.length} lessons · {detail.course.duration_hours || 0}h total</span></div><div className="mt-2"><Syllabus detail={detail} /></div></div><aside className="space-y-8"><section className="border-t-4 border-[#ef765f] bg-[#e5e9d9] p-6 dark:bg-[#1c2923]"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#68766f] dark:text-[#9eaaa2]">How to complete</p><h2 className="mt-3 text-xl font-semibold tracking-[-.03em]">A clear path to the finish</h2><ul className="mt-6 space-y-4 text-sm text-[#435149] dark:text-[#c6d2ca]"><li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#315f50]" />Complete lessons in sequence</li><li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#315f50]" />Watch required video content</li><li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#315f50]" />Pass quizzes within {detail.rules.maxAttempts} attempts</li><li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#315f50]" />Submit assignments for review</li></ul></section><p className="px-1 text-xs leading-5 text-[#78837d] dark:text-[#8e9a92]">Activity tracking provides reasonable completion evidence; it does not prove continuous attention.</p></aside></section>
      </div>
      <AiAssignmentDialog courseId={courseId} courseTitle={String(detail.course.title || 'Course')} lessons={lessonOptions} open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen} onCreated={() => void load()} />
    </main>
  );
}

function CourseLessonPlayer({
  detail,
  courseId,
  lessons,
  selected,
  selectedIndex,
  progress,
  activeSeconds,
  menuOpen,
  onMenuOpenChange,
  onSelectLesson,
  onReload,
}: {
  detail: Detail;
  courseId: string;
  lessons: Row[];
  selected: Row;
  selectedIndex: number;
  progress?: Row;
  activeSeconds: number;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onSelectLesson: (id: string) => void;
  onReload: () => Promise<void>;
}) {
  const videoBlock = selected.blocks?.find((block: Row) => block.type === 'video');
  const assignmentBlock = selected.blocks?.find((block: Row) => block.type === 'assignment');
  const reflectableBlock = selected.blocks?.find((block: Row) => block.required && !['video', 'quiz', 'assignment'].includes(block.type));
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(Number(progress?.furthest_second || 522));
  const [duration, setDuration] = React.useState(Number(videoBlock?.content?.durationSeconds || 720));
  const [captions, setCaptions] = React.useState(true);
  const [playbackRate, setPlaybackRate] = React.useState(1.25);
  const [transcriptOpen, setTranscriptOpen] = React.useState(true);
  const [reflection, setReflection] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const storageKey = `learning-reflection:${courseId}:${selected.id}`;

  React.useEffect(() => {
    setReflection(window.localStorage.getItem(storageKey) || '');
    setStatus('');
  }, [storageKey]);
  React.useEffect(() => {
    const id = window.setTimeout(() => window.localStorage.setItem(storageKey, reflection), 350);
    return () => window.clearTimeout(id);
  }, [reflection, storageKey]);
  const advanceCurrentTime = React.useCallback(
    () => setCurrentTime(value => Math.min(duration, value + playbackRate)),
    [duration, playbackRate]
  );

  useVisibilityInterval(advanceCurrentTime, 1000, !!playing && !videoBlock?.content?.url);

  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  const togglePlayback = async () => {
    if (videoRef.current) {
      if (videoRef.current.paused) await videoRef.current.play(); else videoRef.current.pause();
      setPlaying(!videoRef.current.paused);
      return;
    }
    setPlaying(value => !value);
  };
  const seek = (seconds: number) => {
    const next = Math.max(0, Math.min(duration, seconds));
    setCurrentTime(next);
    if (videoRef.current) videoRef.current.currentTime = next;
  };
  const changeRate = () => {
    const next = playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : 1;
    setPlaybackRate(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };
  const submitReflection = async () => {
    if (!reflection.trim() || !detail.enrollment) return;
    setSubmitting(true);
    setStatus('Saving your reflection…');
    try {
      let response: Response | null = null;
      if (assignmentBlock) {
        response = await fetch('/api/learning/progress', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'submit_assignment', enrollmentId: detail.enrollment.id, blockId: assignmentBlock.id, text: reflection.trim() }) });
      } else if (reflectableBlock && !(progress?.completed_blocks || []).includes(reflectableBlock.id)) {
        response = await fetch('/api/learning/progress', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'complete_block', enrollmentId: detail.enrollment.id, lessonId: selected.id, blockId: reflectableBlock.id }) });
      }
      if (response && !response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || 'Unable to save your reflection.');
      }
      window.localStorage.removeItem(storageKey);
      await onReload();
      const nextLesson = lessons[selectedIndex + 1];
      if (nextLesson?.unlocked) onSelectLesson(nextLesson.id);
      else setStatus('Reflection saved. Finish the remaining required activity to unlock the next lesson.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save your reflection.');
    } finally {
      setSubmitting(false);
    }
  };

  const transcript = Array.isArray(videoBlock?.content?.transcript) && videoBlock.content.transcript.length
    ? videoBlock.content.transcript
    : [
        { time: '08:15', speaker: 'Alex', text: "I felt like my concerns weren't really heard in the last meeting." },
        { time: '08:18', speaker: 'Jordan', text: 'That sounds really frustrating. Can you tell me more about what felt overlooked?' },
        { time: '08:24', speaker: 'Alex', text: 'I shared the data, but we moved on quickly without discussing the impact.' },
        { time: '08:29', speaker: 'Jordan', text: "I see. It's important to you that the data gets the attention it deserves." },
        { time: '08:33', speaker: 'Alex', text: 'Exactly. It could really change the outcome if we look at it closely.' },
      ];

  return (
    <main className="min-h-[calc(100vh-6rem)] bg-[#f8fafc] px-4 pb-8 pt-4 font-dm-sans text-[#17213a] dark:bg-[#09111d] dark:text-[#f4f6fb] sm:px-6 lg:px-9">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={`/learning/courses/${courseId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#316be8] hover:text-[#2457c3] dark:text-[#6fa0ff]"><ArrowLeft className="h-4 w-4" />Back to course</Link>
          <div className="flex items-center gap-3"><Button variant="outline" size="sm" className="border-[#7b8798] bg-transparent" asChild><Link href={`/learning/courses/${courseId}`}><Save className="mr-2 h-4 w-4" />Save and exit</Link></Button><span className="hidden items-center gap-2 text-xs text-[#637188] dark:text-zinc-400 sm:flex"><CheckCircle2 className="h-4 w-4 text-lime-500" />Autosave on · {minutes(activeSeconds)}</span><Button variant="outline" size="icon" className="lg:hidden" onClick={() => onMenuOpenChange(!menuOpen)} aria-label="Toggle course progress"><Menu className="h-4 w-4" /></Button></div>
        </div>

        <div className="mt-2 text-sm text-[#647086] dark:text-zinc-400"><span>{detail.course.title}</span><ChevronRight className="mx-1.5 inline h-3.5 w-3.5" /><span>{detail.sections.find(section => section.lessons.some((lesson: Row) => lesson.id === selected.id))?.title}</span><ChevronRight className="mx-1.5 inline h-3.5 w-3.5" /><span>Lesson {selectedIndex + 1} of {lessons.length}</span></div>

        <div className="mt-3 grid gap-8 lg:grid-cols-[minmax(0,1fr)_460px] xl:grid-cols-[minmax(0,1fr)_480px]">
          <section className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-[-.04em] sm:text-4xl">{selected.title}</h1>
            <div className="relative mt-4 aspect-video overflow-hidden rounded-[7px] border border-[#334055] bg-black">
              {videoBlock?.content?.url ? <video ref={videoRef} src={videoBlock.content.url} poster="/learning/courses/active-listening-workplace.png" className="h-full w-full object-cover" onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)} onDurationChange={event => setDuration(event.currentTarget.duration || duration)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} /> : <Image src="/learning/courses/active-listening-workplace.png" alt="Two coworkers practicing active listening" fill priority sizes="(max-width: 1024px) 100vw, 68vw" className="object-cover" />}
              <div className="absolute inset-x-0 bottom-0 bg-black/70 px-4 pb-3 pt-2 text-white">
                <input aria-label="Video position" type="range" min={0} max={Math.max(1, duration)} value={Math.min(currentTime, duration)} onChange={event => seek(Number(event.target.value))} className="h-1 w-full cursor-pointer accent-[#316be8]" />
                <div className="mt-2 flex items-center gap-3"><button type="button" onClick={() => void togglePlayback()} aria-label={playing ? 'Pause video' : 'Play video'}>{playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}</button><button type="button" onClick={() => seek(currentTime - 10)} aria-label="Back 10 seconds"><RotateCcw className="h-4 w-4" /></button><button type="button" onClick={() => seek(currentTime + 10)} aria-label="Forward 10 seconds"><RotateCw className="h-4 w-4" /></button><Volume2 className="h-4 w-4" /><span className="ml-auto text-xs font-semibold tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span><button type="button" onClick={() => setCaptions(value => !value)} aria-pressed={captions} className={cn('rounded border px-1.5 py-0.5 text-xs font-bold', captions ? 'border-white text-white' : 'border-white/40 text-white/60')}><Captions className="h-4 w-4" /></button><button type="button" onClick={changeRate} className="text-xs font-bold">{playbackRate}x</button><Maximize2 className="h-4 w-4" /></div>
              </div>
            </div>

            <section className="mt-3 overflow-hidden rounded-[7px] border border-[#c9d1dc] dark:border-[#314056]">
              <button type="button" onClick={() => setTranscriptOpen(value => !value)} className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-bold"><span>Transcript</span><span className="flex items-center gap-2 text-xs font-normal text-[#6a778b] dark:text-zinc-400">{transcriptOpen ? 'Hide' : 'Show'}<ChevronUp className={cn('h-4 w-4 transition-transform', !transcriptOpen && 'rotate-180')} /></span></button>
              {transcriptOpen && <div className="max-h-40 space-y-2 border-t border-[#d5dbe3] px-4 py-3 text-xs leading-5 dark:border-[#314056]">{transcript.map((line: Row, index: number) => <p key={`${line.time}-${index}`} className="grid grid-cols-[48px_56px_minmax(0,1fr)] gap-2"><span className="text-[#748197]">{line.time}</span><strong>{line.speaker}:</strong><span className="text-[#536176] dark:text-zinc-300">{line.text}</span></p>)}</div>}
            </section>

            <section className="mt-4">
              <div className="flex items-end justify-between gap-4"><label htmlFor="lesson-reflection" className="text-sm font-bold">What did the listener do that built trust?</label><span className="text-xs text-[#748197]">Your reflection (required)</span></div>
              <textarea id="lesson-reflection" value={reflection} onChange={event => setReflection(event.target.value.slice(0, 500))} className="mt-2 min-h-24 w-full rounded-[6px] border border-[#316be8] bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#316be8]/30" placeholder="Type your response here…" />
              <div className="mt-1 flex justify-between gap-4"><p role="status" className="text-xs text-[#66758a] dark:text-zinc-400">{status || (reflection ? 'Saved automatically' : '')}</p><span className="text-xs tabular-nums text-[#748197]">{reflection.length} / 500</span></div>
              <div className="mt-3 flex justify-end"><Button className="h-11 bg-[#316be8] px-6 hover:bg-[#285dce]" disabled={!reflection.trim() || submitting} onClick={() => void submitReflection()}>{submitting ? 'Saving…' : 'Submit reflection & continue'}<ChevronRight className="ml-2 h-5 w-5" /></Button></div>
            </section>
          </section>

          <CourseProgressRail detail={detail} lessons={lessons} selected={selected} menuOpen={menuOpen} onSelectLesson={id => { onSelectLesson(id); onMenuOpenChange(false); }} />
        </div>
      </div>
    </main>
  );
}

function CourseProgressRail({ detail, lessons, selected, menuOpen, onSelectLesson }: { detail: Detail; lessons: Row[]; selected: Row; menuOpen: boolean; onSelectLesson: (id: string) => void }) {
  return <aside className={cn('relative border-l border-[#cbd3dd] pl-8 dark:border-[#314056] lg:block', menuOpen ? 'block' : 'hidden')}><h2 className="mb-4 text-lg font-bold">Your progress</h2><span aria-hidden="true" className="absolute bottom-12 left-[15px] top-14 w-px bg-[#8f9bad] dark:bg-[#526074]" />{detail.sections.map((section, sectionIndex) => { const sectionLessons = section.lessons || []; const sectionComplete = sectionLessons.every((lesson: Row) => detail.progress[lesson.id]?.status === 'completed'); return <section key={section.id} className="relative pb-3"><span className={cn('absolute -left-8 top-1 z-10 grid h-6 w-6 place-items-center rounded-full border-2 bg-[#f8fafc] dark:bg-[#09111d]', sectionComplete ? 'border-lime-500 text-lime-500' : sectionLessons.some((lesson: Row) => lesson.id === selected.id) ? 'border-[#316be8] text-[#316be8]' : 'border-[#7d899a] text-[#7d899a]')}>{sectionComplete ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : sectionLessons.some((lesson: Row) => lesson.id === selected.id) ? <Play className="h-3 w-3 fill-current" /> : <LockKeyhole className="h-3 w-3" />}</span><div className="flex items-center gap-2 border-b border-[#d7dde5] pb-3 dark:border-[#2c394d]"><strong>Module {sectionIndex + 1}</strong><span className="min-w-0 flex-1 truncate text-sm text-[#607087] dark:text-zinc-300">{section.title}</span><span className="text-[11px] text-[#748197]">{sectionLessons.length} lessons</span></div><div>{sectionLessons.map((lesson: Row) => { const state = detail.progress[lesson.id]?.status; const current = lesson.id === selected.id; const complete = state === 'completed'; const unlocked = lesson.unlocked !== false; const globalIndex = lessons.findIndex(item => item.id === lesson.id); return <button type="button" key={lesson.id} disabled={!unlocked} onClick={() => onSelectLesson(lesson.id)} className={cn('grid w-full grid-cols-[22px_22px_minmax(0,1fr)_55px] items-start gap-2 border-b border-[#d7dde5] px-2 py-3 text-left text-sm dark:border-[#2c394d]', current && 'rounded-[5px] border border-[#265ab7] bg-[#e9f1ff] dark:bg-[#142744]')}><span className={cn('mt-0.5 grid h-5 w-5 place-items-center rounded-full border', complete ? 'border-lime-500 text-lime-500' : current ? 'border-[#316be8] text-[#316be8]' : 'border-[#7d899a] text-[#7d899a]')}>{complete ? <Check className="h-3 w-3" /> : current ? <Play className="h-3 w-3 fill-current" /> : !unlocked ? <LockKeyhole className="h-3 w-3" /> : null}</span><span className="text-xs">{globalIndex + 1}.</span><span><strong className="block font-semibold">{lesson.title}</strong>{current && <span className="mt-1 block text-xs text-[#62738d] dark:text-zinc-300">{lesson.description}</span>}</span><span className="text-right text-xs text-[#6d7a8d]">{lesson.estimated_minutes || 0} min<span className={cn('mt-1 block', complete ? 'text-lime-600 dark:text-lime-400' : current ? 'text-[#316be8]' : '')}>{complete ? 'Completed' : current ? 'In progress' : unlocked ? 'Next' : ''}</span></span></button>; })}</div></section>; })}<div className="relative mt-1 flex items-center gap-3 border-t border-[#d7dde5] py-3 dark:border-[#2c394d]"><span className="absolute -left-8 grid h-6 w-6 place-items-center rounded-full border border-[#7d899a] bg-[#f8fafc] dark:bg-[#09111d]"><Flag className="h-3.5 w-3.5" /></span><strong>Summit</strong><span className="text-sm text-[#607087] dark:text-zinc-300">Final check</span></div></aside>;
}

function CourseOverviewProposal({
  detail,
  courseId,
  lessons,
  completed,
  isDraft,
  saving,
  lessonOptions,
  assignmentDialogOpen,
  onAssignmentDialogChange,
  onStart,
  onReload,
}: {
  detail: Detail;
  courseId: string;
  lessons: Row[];
  completed: number;
  isDraft: boolean;
  saving: boolean;
  lessonOptions: Array<{ id: string; title: string; sectionTitle: string }>;
  assignmentDialogOpen: boolean;
  onAssignmentDialogChange: (open: boolean) => void;
  onStart: () => void;
  onReload: () => void;
}) {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(() => new Set(detail.sections.map(section => String(section.id))));
  React.useEffect(() => setExpandedSections(new Set(detail.sections.map(section => String(section.id)))), [detail.sections]);

  const progressValue = Math.min(100, Math.max(0, Number(detail.enrollment?.progress || 0)));
  const coverImage = String(detail.course.cover_image_url || detail.course.coverImageUrl || '/learning/paths/new-manager-foundations.webp');
  const incompleteLessons = lessons.filter(lesson => detail.progress[lesson.id]?.status !== 'completed');
  const remainingMinutes = incompleteLessons.reduce((total, lesson) => total + Number(lesson.estimated_minutes || 0), 0);
  const currentLessonId = String(detail.enrollment?.current_lesson_id || incompleteLessons.find(lesson => lesson.unlocked)?.id || '');
  const courseDuration = Number(detail.course.duration_hours || detail.course.durationHours || 0);
  const passingScore = Number(detail.rules.passingScore || detail.rules.passing_score || 70);
  const maxAttempts = Number(detail.rules.maxAttempts || detail.rules.max_attempts || 3);
  const toggleSection = (sectionId: string) => setExpandedSections(current => {
    const next = new Set(current);
    if (next.has(sectionId)) next.delete(sectionId); else next.add(sectionId);
    return next;
  });

  return (
    <main className="min-h-full w-full bg-[#f8fafc] px-4 pb-14 pt-5 font-dm-sans text-[#17213a] dark:bg-[#09111d] dark:text-[#f4f6fb] sm:px-6 lg:px-9">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/learning/courses" className="group inline-flex items-center gap-2 text-sm font-semibold text-[#316be8] hover:text-[#2457c3] dark:text-[#6fa0ff]"><ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />Back to courses</Link>
          {detail.canManage && <div className="flex items-center gap-2"><Button type="button" variant="ghost" size="sm" className="text-[#607086] hover:text-[#316be8] dark:text-zinc-300" onClick={() => onAssignmentDialogChange(true)}><Sparkles className="mr-2 h-4 w-4" />Create AI assignment</Button><Button asChild variant="outline" size="sm" className="border-[#7c899b] bg-transparent"><Link href={`/learning/courses/${courseId}/studio`}>Open Studio<span className="ml-2 text-[10px] font-normal text-[#7c899b]">Manager only</span></Link></Button></div>}
        </div>

        <section className="mt-5 grid gap-6 lg:grid-cols-[minmax(420px,.92fr)_minmax(520px,1.08fr)] lg:items-stretch">
          <div className="flex min-h-[276px] flex-col justify-center py-2 lg:pr-8">
            <span className="w-fit rounded bg-[#e9edf4] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#43536a] dark:bg-[#1c2737] dark:text-zinc-200">{detail.course.category || 'General'}</span>
            <h1 className="mt-4 text-[clamp(2.45rem,4.6vw,4rem)] font-semibold leading-[.98] tracking-[-.055em]">{detail.course.title}</h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-6 text-[#5e6b7e] dark:text-[#bcc5d2]">{detail.course.description || 'A focused learning experience designed to help you put new skills into practice.'}</p>
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-[#64748b]" /><div><dt className="sr-only">Total duration</dt><dd className="font-bold">{courseDuration} hours</dd><p className="text-xs text-[#748094] dark:text-zinc-400">Total duration</p></div></div>
              <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-[#64748b]" /><div><dt className="sr-only">Lessons</dt><dd className="font-bold">{lessons.length} lessons</dd><p className="text-xs text-[#748094] dark:text-zinc-400">Total lessons</p></div></div>
              <div className="flex items-center gap-2"><Target className="h-5 w-5 text-[#64748b]" /><div><dt className="sr-only">Progress</dt><dd className="font-bold">{progressValue}%</dd><p className="text-xs text-[#748094] dark:text-zinc-400">Complete</p></div></div>
            </dl>
            {!isDraft && <div className="mt-5 max-w-[670px]"><div className="mb-2 flex items-center justify-between text-sm"><span>{completed} of {lessons.length} lessons complete</span><span className="font-bold text-[#316be8]">{progressValue}%</span></div><Progress value={progressValue} className="h-1.5 bg-[#d4dae2] [&>div]:bg-[#316be8] dark:bg-white/15" /></div>}
            <div className="mt-5">{isDraft ? <Button asChild className="h-12 rounded-md bg-[#316be8] px-7 hover:bg-[#285dce]"><Link href={`/learning/courses/${courseId}/studio`}>Open Course Studio<ChevronRight className="ml-2 h-5 w-5" /></Link></Button> : <Button className="h-12 rounded-md bg-[#316be8] px-7 text-base font-semibold hover:bg-[#285dce]" onClick={onStart} disabled={saving}>{saving ? 'Opening…' : detail.enrollment ? 'Continue course' : 'Start course'}<ChevronRight className="ml-2 h-5 w-5" /></Button>}</div>
          </div>
          <div className="relative min-h-[290px] overflow-hidden rounded-[8px] bg-[#d9e3e1] lg:min-h-[335px]"><Image src={coverImage} alt={`${String(detail.course.title || 'Course')} cover`} fill priority unoptimized sizes="(max-width: 1024px) 100vw, 54vw" className="object-cover" /></div>
        </section>

        <section className="mt-3 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
          <aside className="h-fit rounded-[8px] border border-[#cbd3dd] bg-white p-6 dark:border-[#2f3b4d] dark:bg-[#111b29] lg:sticky lg:top-24">
            <h2 className="text-lg font-bold">Your journey</h2>
            <p className="mt-7 text-4xl font-semibold tracking-[-.05em] text-[#316be8]">{progressValue}%</p><p className="mt-1 text-base text-[#5f6d82] dark:text-zinc-300">Complete</p>
            <Progress value={progressValue} className="mt-4 h-1.5 bg-[#d6dce4] [&>div]:bg-[#316be8] dark:bg-white/15" /><p className="mt-2 text-right text-xs text-[#728095] dark:text-zinc-400">{completed} of {lessons.length} lessons</p>
            <div className="mt-6 border-y border-[#dde2e8] py-5 dark:border-[#2f3b4d]"><div className="flex items-center gap-3"><Clock3 className="h-5 w-5 text-[#65758b]" /><div><p className="font-bold">~{remainingMinutes} min</p><p className="mt-0.5 text-xs text-[#728095] dark:text-zinc-400">Estimated time remaining</p></div></div></div>
            <div className="pt-6"><h3 className="text-sm font-bold">To complete this course</h3><ul className="mt-5 space-y-5 text-sm"><li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#718096]" /><span><strong className="block">Complete all {lessons.length} lessons</strong><span className="mt-1 block text-xs text-[#728095] dark:text-zinc-400">Work through each lesson in order</span></span></li><li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#718096]" /><span><strong className="block">Pass the final check</strong><span className="mt-1 block text-xs text-[#728095] dark:text-zinc-400">Score at least {passingScore}% within {maxAttempts} attempts</span></span></li><li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#718096]" /><span><strong className="block">Apply and reflect</strong><span className="mt-1 block text-xs text-[#728095] dark:text-zinc-400">Use what you learn in the real world</span></span></li></ul></div>
          </aside>

          <div className="relative min-w-0 pb-4">
            <span aria-hidden="true" className="absolute bottom-16 left-4 top-5 w-px bg-[#9aa6b6] dark:bg-[#526074]" />
            {detail.sections.map((section, sectionIndex) => {
              const sectionId = String(section.id);
              const expanded = expandedSections.has(sectionId);
              const sectionLessons = section.lessons || [];
              const sectionComplete = sectionLessons.length > 0 && sectionLessons.every((lesson: Row) => detail.progress[lesson.id]?.status === 'completed');
              const sectionMinutes = sectionLessons.reduce((sum: number, lesson: Row) => sum + Number(lesson.estimated_minutes || 0), 0);
              return <section key={sectionId} className="relative pl-11">
                <span className={cn('absolute left-0 top-[18px] z-10 grid h-8 w-8 place-items-center rounded-full border-2 bg-[#f8fafc] dark:bg-[#09111d]', sectionComplete ? 'border-emerald-500 text-emerald-500' : sectionIndex === 0 ? 'border-[#316be8] text-[#316be8]' : 'border-[#7f8b9d] text-[#7f8b9d]')}>{sectionComplete ? <Check className="h-4 w-4 stroke-[3]" /> : <BookOpen className="h-4 w-4" />}</span>
                <button type="button" onClick={() => toggleSection(sectionId)} className="flex w-full items-center gap-3 border-b border-[#d8dee6] py-4 text-left dark:border-[#263447]" aria-expanded={expanded}><span className="font-bold">Module {sectionIndex + 1}</span><span className="min-w-0 flex-1 truncate text-[#657286] dark:text-zinc-300">{section.title}</span><span className="hidden text-xs text-[#748094] sm:block">{sectionLessons.length} lesson{sectionLessons.length === 1 ? '' : 's'} · {sectionMinutes} min</span><ChevronRight className={cn('h-4 w-4 text-[#748094] transition-transform', expanded && 'rotate-90')} /></button>
                {expanded && <div>{sectionLessons.map((lesson: Row, lessonIndex: number) => {
                  const lessonStatus = detail.progress[lesson.id]?.status;
                  const isComplete = lessonStatus === 'completed';
                  const isCurrent = String(lesson.id) === currentLessonId || lessonStatus === 'in_progress';
                  const isUnlocked = lesson.unlocked !== false;
                  return <div key={lesson.id} className={cn('grid gap-3 border-b border-[#d8dee6] py-3.5 pl-1 sm:grid-cols-[38px_210px_minmax(0,1fr)_70px_90px] sm:items-center dark:border-[#263447]', isCurrent && 'bg-[#eaf1ff] px-3 dark:bg-[#142744]')}><span className={cn('grid h-6 w-6 place-items-center rounded-full border', isComplete ? 'border-emerald-500 text-emerald-500' : isCurrent ? 'border-[#316be8] text-[#316be8]' : 'border-[#718096] text-[#718096]')}>{isComplete ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : isCurrent ? <Play className="h-3.5 w-3.5 fill-current" /> : !isUnlocked ? <LockKeyhole className="h-3.5 w-3.5" /> : <span className="text-[10px] font-bold">{lessonIndex + 1}</span>}</span><p className="truncate text-sm font-semibold">{lesson.title}</p><p className="truncate text-xs text-[#69778b] dark:text-zinc-400">{lesson.description || 'Continue building practical skills in this lesson.'}</p><p className="text-xs text-[#69778b] dark:text-zinc-400">{lesson.estimated_minutes || 0} min</p><div className="sm:text-right">{isComplete ? <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Completed</span> : isCurrent ? <Button type="button" size="sm" className="h-7 bg-[#316be8] px-3 text-xs" onClick={onStart}>Continue</Button> : <span className="text-xs font-medium text-[#748094]">{isUnlocked ? 'Available' : 'Locked'}</span>}</div></div>;
                })}</div>}
              </section>;
            })}
            <div className="relative ml-0 flex items-center gap-4 border-b border-[#d8dee6] py-5 pl-11 dark:border-[#263447]"><span className="absolute left-0 grid h-8 w-8 place-items-center rounded-full border-2 border-[#7f8b9d] bg-[#f8fafc] text-[#7f8b9d] dark:bg-[#09111d]"><Flag className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="font-bold">Summit <span className="ml-2 font-normal text-[#657286] dark:text-zinc-300">Final check</span></p><p className="mt-1 text-xs text-[#748094] dark:text-zinc-400">Complete the final check to finish the course.</p></div><span className="rounded bg-[#e9edf3] px-3 py-1.5 text-xs font-semibold text-[#657286] dark:bg-[#172335] dark:text-zinc-300">Locked</span></div>
          </div>
        </section>
      </div>
      <AiAssignmentDialog courseId={courseId} courseTitle={String(detail.course.title || 'Course')} lessons={lessonOptions} open={assignmentDialogOpen} onOpenChange={onAssignmentDialogChange} onCreated={onReload} />
    </main>
  );
}

function Syllabus({ detail, selected, onSelect, compact = false }: { detail: Detail; selected?: string; onSelect?: (id: string) => void; compact?: boolean }) {
  return <div className={cn(compact ? 'space-y-6' : 'divide-y divide-[#d5d1c7] dark:divide-white/10')}>{detail.sections.map((section, sectionIndex) => <section key={section.id} className={cn(!compact && 'grid gap-5 py-7 sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-8')}><div className={cn(compact && 'mb-2', !compact && 'pt-3')}><p className={cn('text-[10px] font-bold uppercase tracking-[.2em] text-[#ff654c]', compact && 'hidden')}>Module {String(sectionIndex + 1).padStart(2,'0')}</p><h3 className={cn('font-semibold text-slate-600 dark:text-zinc-300', compact ? 'text-xs uppercase tracking-[.14em]' : 'mt-2 text-base leading-5 text-[#303951] dark:text-[#d9deea]')}>{section.title}</h3></div><div className={cn(!compact && 'space-y-1')}>{section.lessons.map((lesson: Row, lessonIndex: number) => {
    const status = detail.progress[lesson.id]?.status;
    return <button type="button" key={lesson.id} disabled={!lesson.unlocked || !onSelect} onClick={() => onSelect?.(lesson.id)} className={cn('group flex w-full items-center gap-3 text-left transition duration-300', compact ? 'border-t border-slate-300 px-1 py-3 text-sm dark:border-zinc-700' : 'px-0 py-3.5 sm:px-2', selected === lesson.id && 'font-bold text-[#2947c7] dark:text-[#9eafff]', onSelect && lesson.unlocked && (compact ? 'hover:pl-2' : 'hover:translate-x-1'))}><span className={cn(!compact && 'grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#c8c5bc] text-[11px] font-bold text-[#6c7382] transition-colors group-hover:border-[#2947c7] group-hover:text-[#2947c7] dark:border-white/20 dark:text-[#b1b7c3]')}>{status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-[#2947c7] dark:text-[#9eafff]" /> : compact ? (lesson.unlocked ? <Play className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4 text-slate-400" />) : String(lessonIndex + 1).padStart(2, '0')}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">{lesson.title}</span><span className="text-xs font-medium text-[#7b8190] dark:text-[#9fa6b4]">{lesson.estimated_minutes} min</span></button>;
  })}</div></section>)}</div>;
}

function ContentBlock({ block, detail, lesson, onDone }: { block: Row; detail: Detail; lesson: Row; onDone: () => void }) {
  const content = block.content || {};
  const completed = (detail.progress[lesson.id]?.completed_blocks || []).includes(block.id);
  const mark = async () => {
    await fetch('/api/learning/progress', { method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'complete_block',enrollmentId:detail.enrollment?.id,lessonId:lesson.id,blockId:block.id}) });
    onDone();
  };
  if (block.type === 'text') return <article className="prose prose-slate max-w-none dark:prose-invert"><h2>{block.title}</h2><div className="whitespace-pre-wrap">{content.text as string}</div>{block.required && !completed && <Button variant="outline" className="mt-5" onClick={mark}><Check className="mr-2 h-4 w-4" />Mark as read</Button>}</article>;
  if (block.type === 'video') return <VideoBlock block={block} detail={detail} lesson={lesson} onDone={onDone} />;
  if (block.type === 'attachment' || block.type === 'acknowledgement') return <section className="flex items-center gap-4 border-y border-slate-300 py-5 dark:border-zinc-700"><FileText className="h-8 w-8" /><div className="flex-1"><h2 className="font-bold">{block.title}</h2><p className="text-sm text-slate-500">{content.description as string}</p></div><Button asChild variant="outline"><a href={content.url as string} download onClick={() => block.type === 'attachment' && void mark()}><Download className="mr-2 h-4 w-4" />Open</a></Button>{block.type === 'acknowledgement' && <Button disabled={completed} onClick={mark}>{completed ? 'Acknowledged' : 'I acknowledge'}</Button>}</section>;
  if (block.type === 'break') return <section className="rounded-[8px] border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-900/70 dark:bg-indigo-950/30"><Pause className="h-5 w-5 text-indigo-700 dark:text-indigo-300" /><h2 className="mt-3 text-xl font-bold">{block.title || 'Take a break'}</h2><p className="mt-2 text-sm">Rest for {content.minutes as number || 5} minutes. Break time is not counted as learning time.</p><Button variant="outline" className="mt-4" onClick={mark} disabled={completed}>{completed ? 'Break complete' : 'Return to learning'}</Button></section>;
  if (block.type === 'quiz') return <Quiz block={block} detail={detail} lesson={lesson} onDone={onDone} />;
  if (block.type === 'assignment') return <Assignment block={block} detail={detail} />;
  return null;
}

function VideoBlock({block,detail,lesson,onDone}:{block:Row;detail:Detail;lesson:Row;onDone:()=>void}) {
  const ref=React.useRef<HTMLVideoElement>(null);const furthest=React.useRef(Number(detail.progress[lesson.id]?.furthest_second||0));const lastSent=React.useRef(0);const [message,setMessage]=React.useState('');
  const update=()=>{const video=ref.current;if(!video)return;if(video.currentTime>furthest.current+1.5){video.currentTime=furthest.current;setMessage('Continue watching before skipping ahead.');return}furthest.current=Math.max(furthest.current,video.currentTime);if(video.currentTime-lastSent.current>=10&&detail.enrollment){lastSent.current=video.currentTime;void fetch('/api/learning/progress',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'heartbeat',enrollmentId:detail.enrollment.id,lessonId:lesson.id,seconds:0,furthestSecond:Math.floor(furthest.current)})})}};
  const finish=async()=>{if(!detail.enrollment)return;const r=await fetch('/api/learning/progress',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'complete_block',enrollmentId:detail.enrollment.id,lessonId:lesson.id,blockId:block.id})});const p=await r.json();setMessage(r.ok?'Video requirement complete.':p.message);if(r.ok)onDone()};
  return <section><h2 className="mb-3 text-xl font-bold">{block.title}</h2><video ref={ref} className="aspect-video w-full bg-black" controls controlsList="nodownload" src={block.content?.url} onTimeUpdate={update} onSeeking={update} onEnded={()=>void finish()}/><p className="mt-2 text-xs text-slate-500">Watch at least {block.content?.requiredWatchPercent||90}%. Forward seeking is limited to your furthest confirmed position.</p>{message&&<p role="status" className="mt-2 text-sm font-semibold">{message}</p>}</section>
}

function Assignment({ block, detail }: { block: Row; detail: Detail }) {
  const [text,setText]=React.useState('');
  const [fileUrl,setFileUrl]=React.useState('');
  const [message,setMessage]=React.useState('');
  const submit=async()=>{const response=await fetch('/api/learning/progress',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'submit_assignment',enrollmentId:detail.enrollment?.id,blockId:block.id,text,fileUrl})});const payload=await response.json();setMessage(response.ok?'Submitted for HR review.':payload.message||'Unable to submit');};
  return <section><Upload className="h-5 w-5" /><h2 className="mt-3 text-xl font-bold">{block.title}</h2><p className="mt-2 text-sm text-slate-600 dark:text-zinc-300">{block.content?.instructions}</p><textarea value={text} onChange={e=>setText(e.target.value)} className="mt-4 min-h-32 w-full border border-slate-300 bg-transparent p-3 text-sm dark:border-zinc-700" placeholder="Write your response…"/><input value={fileUrl} onChange={e=>setFileUrl(e.target.value)} className="mt-3 h-10 w-full border border-slate-300 bg-transparent px-3 text-sm dark:border-zinc-700" placeholder="Attachment URL (optional)"/><Button className="mt-3" onClick={submit} disabled={!text.trim()&&!fileUrl.trim()}>Submit assignment</Button>{message&&<p className="mt-2 text-sm" role="status">{message}</p>}</section>;
}

function Quiz({ block, detail, onDone }: { block: Row; detail: Detail; lesson: Row; onDone: () => void }) {
  const questions = Array.isArray(block.content?.questions) ? block.content.questions : [];
  const [answers,setAnswers]=React.useState<Record<string,string>>({});
  const [result,setResult]=React.useState<Row|null>(null);
  const submit=async()=>{const response=await fetch('/api/learning/progress',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'submit_quiz',enrollmentId:detail.enrollment?.id,blockId:block.id,answers})});const payload=await response.json();setResult(response.ok?payload.data:{message:payload.message});if(payload.data?.passed)onDone();};
  return <section><h2 className="text-xl font-bold">{block.title || 'Knowledge check'}</h2><div className="mt-5 space-y-6">{questions.map((question:Row)=><fieldset key={question.id}><legend className="text-sm font-semibold">{question.prompt}</legend><div className="mt-2 space-y-2">{(question.options||[]).map((option:string)=><label key={option} className="flex gap-3 text-sm"><input type="radio" name={question.id} value={option} onChange={()=>setAnswers(a=>({...a,[question.id]:option}))}/>{option}</label>)}</div></fieldset>)}</div><Button className="mt-5" onClick={submit} disabled={Object.keys(answers).length<questions.length}>Submit answers</Button>{result&&<p role="status" className={cn('mt-3 text-sm font-semibold',result.passed?'text-emerald-700':'text-rose-700')}>{result.message || `${result.score}% — ${result.passed?'Passed':'Try again'}`}</p>}</section>;
}
