"use client";

import Link from "next/link";
import * as React from "react";
import {
  AcademicCapIcon,
  BookOpenIcon,
  ChevronRightIcon,
  ClockIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  RectangleGroupIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  displayLearningValue as text,
  isActiveLearningCourse as isCourseActive,
  learningBooleanValue as booleanValue,
  learningCourseColor as courseColor,
  learningRecordValue as recordValue,
} from "@/lib/learning/record-utils";
import type { LearningRecord } from "./learning-workspace-model";
import { EmptyInline, EmptyState, StatusPill } from "./LearningUiPrimitives";

export function LegacyCourseCatalog({
  courses,
  onAddNew,
  onAiCreate,
  onRemove,
  onAssign,
  removingCourseId,
}: {
  courses: LearningRecord[];
  onAddNew: () => void;
  onAiCreate?: () => void;
  onRemove: (course: LearningRecord) => void;
  onAssign: (course: LearningRecord) => void;
  removingCourseId: string | null;
}) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [display, setDisplay] = React.useState<"grid" | "list">("grid");
  const catalogCourses = courses.filter(isCourseActive);
  const categories = Array.from(
    new Set(catalogCourses.map((course) => text(course.category, "General"))),
  ).sort();
  const filtered = catalogCourses.filter((course) => {
    const matchesQuery =
      `${text(course.title, "")} ${text(course.description, "")} ${text(course.category, "")}`
        .toLowerCase()
        .includes(query.toLowerCase());
    return (
      matchesQuery &&
      (category === "all" || text(course.category, "General") === category)
    );
  });

  if (catalogCourses.length === 0) {
    return (
      <div className="min-h-[calc(100vh-7rem)] bg-[#fbfaf6] px-4 pb-14 pt-7 text-[#172033] dark:bg-zinc-950 dark:text-zinc-50 sm:px-7 lg:px-12 xl:px-[68px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[2rem] font-bold leading-tight tracking-[-0.035em] sm:text-[2.35rem]">
              Courses
            </h1>
            <p className="mt-1.5 text-[15px] text-[#6f7886] dark:text-zinc-400">
              Explore skills for every stage of your journey.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {onAiCreate && (
              <Button
                type="button"
                variant="outline"
                onClick={onAiCreate}
                className="h-10 rounded-md border-[#cbd3dc] bg-white px-4 font-semibold text-[#314052] shadow-none hover:bg-[#f3f5f6] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <SparklesIcon className="mr-2 h-4 w-4 text-[#316be8]" />
                Create with AI
              </Button>
            )}
            <Button
              type="button"
              onClick={onAddNew}
              className="h-10 rounded-md bg-[#316be8] px-4 font-semibold shadow-none hover:bg-[#285dce]"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Create course
            </Button>
          </div>
        </header>
        <div className="mt-10">
          <EmptyState
            icon={AcademicCapIcon}
            title="Build your learning catalog"
            description="Start with one useful course. Add the duration, category, and whether every employee needs to complete it."
            action="Create first course"
            onAction={onAddNew}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-[#fbfaf5] shadow-[0_10px_35px_rgba(30,48,42,.06)] dark:border-zinc-800 dark:bg-[#171d1a]">
        <div className="flex flex-col gap-3 p-3 md:flex-row md:items-center">
          <label className="relative min-w-0 flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <span className="sr-only">Search courses</span>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, category, or topic"
              className="h-11 rounded-xl border-0 bg-white pl-9 shadow-none focus-visible:ring-2 focus-visible:ring-[#6b8e7f] dark:bg-white/5"
            />
          </label>
          <div className="flex rounded-md border border-slate-200 p-0.5 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setDisplay("grid")}
              aria-label="Grid view"
              aria-pressed={display === "grid"}
              className={cn(
                "grid h-8 w-9 place-items-center rounded text-slate-500",
                display === "grid" &&
                  "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950",
              )}
            >
              <RectangleGroupIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDisplay("list")}
              aria-label="List view"
              aria-pressed={display === "list"}
              className={cn(
                "grid h-8 w-9 place-items-center rounded text-slate-500",
                display === "list" &&
                  "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950",
              )}
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <nav
          aria-label="Course categories"
          className="flex gap-2 overflow-x-auto border-t border-slate-200 px-3 py-3 [scrollbar-width:none] dark:border-white/10"
        >
          <button
            type="button"
            onClick={() => setCategory("all")}
            aria-pressed={category === "all"}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              category === "all"
                ? "bg-[#173f35] text-[#f7f4e9]"
                : "text-slate-600 hover:bg-[#e8eadf] hover:text-[#173f35] dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white",
            )}
          >
            All courses
          </button>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                category === item
                  ? "bg-[#173f35] text-[#f7f4e9]"
                  : "text-slate-600 hover:bg-[#e8eadf] hover:text-[#173f35] dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white",
              )}
            >
              {item}
            </button>
          ))}
        </nav>
      </section>

      {category !== "all" && (
        <section className="relative overflow-hidden rounded-[24px] bg-[#e5e9d9] px-6 py-7 text-[#173f35] dark:bg-[#1c2923] dark:text-[#e9f0eb] sm:px-8 sm:py-9">
          <span
            className="pointer-events-none absolute -right-12 -top-20 h-44 w-44 rounded-full border-[28px] border-[#d6df6d] opacity-80"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#65776e] dark:text-[#a9b9b0]">
                Selected collection
              </p>
              <h2 className="mt-2 max-w-2xl text-[clamp(1.8rem,4vw,3.25rem)] font-semibold leading-none tracking-[-.05em]">
                {category}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#52665d] dark:text-[#b9c8c0]">
                A focused collection for building practical{" "}
                {category.toLowerCase()} capability across your team.
              </p>
            </div>
            <div className="relative flex items-center gap-4 pr-16 sm:pr-0">
              <span className="text-4xl font-semibold tracking-[-.06em]">
                {filtered.length}
              </span>
              <span className="max-w-20 text-xs font-bold uppercase leading-4 tracking-[.12em] text-[#65776e] dark:text-[#a9b9b0]">
                course{filtered.length === 1 ? "" : "s"} available
              </span>
            </div>
          </div>
        </section>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
          {category === "all"
            ? `${filtered.length} course${filtered.length === 1 ? "" : "s"} in the catalog`
            : query
              ? `${filtered.length} matching course${filtered.length === 1 ? "" : "s"}`
              : `Explore ${category}`}
        </p>
        {(query || category !== "all") && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
            className="text-xs font-semibold text-[#315f50] hover:underline dark:text-[#9bc4b1]"
          >
            View all courses
          </button>
        )}
      </div>

      {filtered.length ? (
        display === "grid" ? (
          <CourseGrid
            courses={filtered}
            onRemove={onRemove}
            onAssign={onAssign}
            removingCourseId={removingCourseId}
          />
        ) : (
          <CourseList
            courses={filtered}
            onRemove={onRemove}
            onAssign={onAssign}
            removingCourseId={removingCourseId}
          />
        )
      ) : (
        <EmptyInline
          title="No courses match"
          description="Try a broader search or clear the category filter."
        />
      )}
    </div>
  );
}

function CourseGrid({
  courses,
  onRemove,
  onAssign,
  removingCourseId,
}: {
  courses: LearningRecord[];
  onRemove: (course: LearningRecord) => void;
  onAssign: (course: LearningRecord) => void;
  removingCourseId: string | null;
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {courses.map((course) => (
        <article
          key={course.id}
          className="group flex min-h-72 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(30,48,87,0.06)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_18px_38px_rgba(49,107,232,0.14)] dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-indigo-800 dark:hover:bg-zinc-900"
        >
          <div className="relative flex h-24 items-start justify-between overflow-hidden bg-[#eaf3f5] px-5 pt-4 text-[#35536d] dark:bg-[#243342] dark:text-blue-200">
            <BookOpenIcon className="relative z-10 h-7 w-7 stroke-[1.5] transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110" />
            <span className="relative z-10 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.13em] dark:bg-zinc-900/70">
              {text(course.category, "General")}
            </span>
            <span
              className="absolute right-7 top-4 h-8 w-8 rounded-full bg-[#f4c95d] opacity-80"
              aria-hidden="true"
            />
            <span
              className="absolute -bottom-12 -left-8 h-24 w-48 rotate-6 rounded-[50%] bg-[#93b89a]"
              aria-hidden="true"
            />
            <span
              className="absolute -bottom-14 left-[28%] h-24 w-56 -rotate-3 rounded-[50%] bg-[#6f977d]"
              aria-hidden="true"
            />
            <span
              className={cn(
                "absolute bottom-0 left-0 h-1.5 w-full",
                courseColor(course.category),
              )}
              aria-hidden="true"
            />
          </div>
          <div className="flex flex-1 flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">
                Ready to explore
              </p>
              <StatusPill
                status={isCourseActive(course) ? "active" : "archived"}
              />
            </div>
            <Link
              href={`/learning/courses/${course.id}`}
              className="mt-4 block"
            >
              <h2 className="line-clamp-2 text-lg font-semibold leading-6 tracking-[-0.02em] group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                {text(course.title, "Untitled course")}
              </h2>
            </Link>
            <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-500 dark:text-zinc-400">
              {text(
                course.description,
                "Add a short description so employees know what they will learn.",
              )}
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-zinc-800 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4" />
                {text(
                  recordValue(course, "durationHours", "duration_hours"),
                  "0",
                )}
                h
              </span>
              {booleanValue(course.isRequired, course.is_required) && (
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#7b5531] dark:text-amber-300">
                  <ShieldCheckIcon className="h-4 w-4" />
                  Required
                </span>
              )}
              <button
                type="button"
                onClick={() => onAssign(course)}
                className="ml-auto inline-flex items-center font-semibold text-indigo-700 hover:text-indigo-900 dark:text-indigo-300"
              >
                <UserGroupIcon className="mr-1 h-4 w-4" />
                Assign
              </button>
              <button
                type="button"
                onClick={() => onRemove(course)}
                disabled={removingCourseId === course.id}
                className="inline-flex items-center font-semibold text-rose-600 hover:text-rose-700 disabled:cursor-wait disabled:opacity-50 dark:text-rose-400 dark:hover:text-rose-300"
                aria-label={`Remove ${text(course.title, "course")}`}
              >
                <TrashIcon className="mr-1 h-4 w-4" />
                {removingCourseId === course.id ? "Removing…" : "Remove"}
              </button>
              <Link
                href={`/learning/courses/${course.id}/studio`}
                className="font-semibold hover:text-slate-950 dark:hover:text-white"
              >
                Studio
              </Link>
              <Link
                href={`/learning/courses/${course.id}`}
                className="inline-flex items-center font-semibold text-indigo-700 dark:text-indigo-300"
              >
                Open{" "}
                <ChevronRightIcon className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function CourseList({
  courses,
  onRemove,
  onAssign,
  removingCourseId,
}: {
  courses: LearningRecord[];
  onRemove: (course: LearningRecord) => void;
  onAssign: (course: LearningRecord) => void;
  removingCourseId: string | null;
}) {
  return (
    <section className="divide-y divide-slate-100 overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/50">
      {courses.map((course) => (
        <article
          key={course.id}
          className="grid gap-3 px-4 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-900 sm:grid-cols-[8px_minmax(0,1fr)_120px_110px_90px_86px_90px] sm:items-center"
        >
          <div
            className={cn("h-full min-h-10 w-2", courseColor(course.category))}
          />
          <div className="min-w-0">
            <Link
              href={`/learning/courses/${course.id}`}
              className="truncate text-sm font-semibold hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              {text(course.title, "Untitled course")}
            </Link>
            <p className="mt-1 truncate text-xs text-slate-500 dark:text-zinc-400">
              {text(course.description, "No description")}
            </p>
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            {text(course.category, "General")}
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
            <ClockIcon className="h-4 w-4" />
            {text(
              recordValue(course, "durationHours", "duration_hours"),
              "0",
            )}{" "}
            hours
          </span>
          <StatusPill status={isCourseActive(course) ? "active" : "archived"} />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onAssign(course)}
          >
            <UserGroupIcon className="mr-1.5 h-4 w-4" />
            Assign
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onRemove(course)}
            disabled={removingCourseId === course.id}
            className="justify-start text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 sm:justify-center"
          >
            <TrashIcon className="mr-1.5 h-4 w-4" />
            {removingCourseId === course.id ? "Removing…" : "Remove"}
          </Button>
        </article>
      ))}
    </section>
  );
}
