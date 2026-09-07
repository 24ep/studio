import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  BookmarkIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  QueueListIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { FireIcon as FireIconSolid } from "@heroicons/react/24/solid";
import { UsersRound as CourseUsersIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  displayLearningValue as text,
  isActiveLearningCourse as isCourseActive,
  learningNumberValue as numberValue,
  learningRecordValue as recordValue,
  normalizeLearningStatus as normalizeStatus,
} from "@/lib/learning/record-utils";
import type { LearningRecord } from "./learning-workspace-model";

export function LearningOverview({
  courses,
  enrollments,
  certificates,
  metrics,
}: {
  courses: LearningRecord[];
  enrollments: LearningRecord[];
  certificates: LearningRecord[];
  metrics: Array<{ label: string; value: string | number; helper?: string }>;
}) {
  const completed = enrollments.filter(
    (item) => normalizeStatus(item.status) === "completed",
  ).length;
  const inProgress = enrollments.filter(
    (item) => normalizeStatus(item.status) === "in_progress",
  );
  const currentEnrollment =
    inProgress[0] ||
    enrollments.find((item) => normalizeStatus(item.status) !== "completed");
  const currentCourse =
    courses.find(
      (course) =>
        course.id ===
        recordValue(currentEnrollment || {}, "courseId", "course_id"),
    ) || courses.find(isCourseActive);
  const progressValue = currentEnrollment
    ? Math.min(100, Math.max(0, numberValue(currentEnrollment.progress)))
    : 65;
  const currentTitle = text(currentCourse?.title, "Confident Conversations");
  const currentLesson = text(
    recordValue(
      currentEnrollment || {},
      "currentLessonTitle",
      "current_lesson_title",
    ),
    "Giving feedback that lands",
  );
  const continueHref = currentCourse?.id
    ? `/learning/courses/${currentCourse.id}`
    : "/learning/courses";
  const availableNext = courses
    .filter(
      (course) => course.id !== currentCourse?.id && isCourseActive(course),
    )
    .slice(0, 2);
  const upNext = [
    {
      title: text(
        availableNext[0]?.title,
        "Navigating difficult conversations",
      ),
      description: text(
        availableNext[0]?.description,
        "Approach challenging conversations with confidence and clarity.",
      ),
      minutes: 22,
      color: "bg-[#ef7448]",
      step: 6,
      href: availableNext[0]?.id
        ? `/learning/courses/${availableNext[0].id}`
        : "/learning/courses",
    },
    {
      title: text(availableNext[1]?.title, "Coaching for growth"),
      description: text(
        availableNext[1]?.description,
        "Help your team set goals and take action.",
      ),
      minutes: 20,
      color: "bg-[#e7ad35]",
      step: 7,
      href: availableNext[1]?.id
        ? `/learning/courses/${availableNext[1].id}`
        : "/learning/paths",
    },
  ];
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
  const completionCopy =
    completed > 0
      ? `${completed} course${completed === 1 ? "" : "s"} completed so far.`
      : "Your first milestone is closer than it looks.";

  return (
    <div className="bg-[#f7f9fc] font-sans text-slate-950 [font-feature-settings:'kern','liga'] [font-kerning:normal]">
      <section className="relative isolate min-h-[610px] overflow-hidden border-b border-slate-200">
        <Image
          src="/learning/adventure-trail-hero.png"
          alt="A mountain trail winding toward a summit"
          fill
          priority
          unoptimized
          sizes="100vw"
          className="z-0 object-cover object-center"
        />
        <div
          className="absolute inset-0 z-[1] bg-white/10"
          aria-hidden="true"
        />

        <div className="mx-auto grid min-h-[610px] w-full max-w-[1600px] items-center px-4 py-12 sm:px-6 lg:grid-cols-[minmax(420px,640px)_1fr] lg:px-10 xl:px-14">
          <div className="relative z-10">
            <p className="text-sm font-medium leading-5 text-[#5873a4]">
              {dateLabel}
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-[#172033] sm:text-[2.875rem]">
              Adventure Trail
            </h1>
            <p className="mt-3 text-xl font-normal leading-7 tracking-[-0.015em] text-slate-600 sm:text-[1.375rem]">
              Grow your skills. Achieve more together.
            </p>

            <article className="mt-8 rounded-2xl border border-white/80 bg-white/95 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.16)] backdrop-blur sm:p-7">
              <p className="text-xs font-bold uppercase leading-4 tracking-[0.06em] text-[#316be8]">
                Pick up where you left off
              </p>
              <div className="mt-4 flex items-start gap-4 border-b border-slate-200 pb-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#637bea] text-white shadow-sm">
                  <CourseUsersIcon className="h-7 w-7 stroke-[1.6]" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-[1.375rem] font-semibold leading-7 tracking-[-0.02em] text-[#172033]">
                    {currentTitle}
                  </h2>
                  <p className="mt-1 text-base font-normal leading-6 text-slate-500">
                    Course
                  </p>
                </div>
              </div>

              <div className="grid gap-6 pt-5 sm:grid-cols-[minmax(0,1fr)_190px]">
                <div>
                  <p className="text-sm font-normal leading-5 text-slate-500">
                    Current lesson
                  </p>
                  <h3 className="mt-1 text-xl font-semibold leading-7 tracking-[-0.015em] text-[#172033]">
                    {currentLesson}
                  </h3>
                  <p className="mt-2 max-w-[38ch] text-base font-normal leading-6 text-slate-600">
                    Learn how to deliver feedback that inspires action and
                    builds trust.
                  </p>
                </div>
                <div>
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-sm font-normal leading-5 text-slate-500">
                      Your progress
                    </p>
                    <p className="text-[1.75rem] font-bold leading-none tabular-nums text-[#316be8]">
                      {progressValue}%
                    </p>
                  </div>
                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
                    role="progressbar"
                    aria-label="Course progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progressValue}
                  >
                    <div
                      className="h-full rounded-full bg-indigo-600"
                      style={{ width: `${progressValue}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-5 text-base font-medium leading-6 text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 stroke-[1.7]" />
                    18 min
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <BookmarkIcon className="h-5 w-5 stroke-[1.7]" />
                    Lesson 5 of 8
                  </span>
                </div>
                <Button
                  asChild
                  className="h-12 rounded-lg bg-[#316be8] px-5 text-base font-semibold shadow-md shadow-indigo-950/15 hover:bg-[#285dce] focus-visible:ring-indigo-500"
                >
                  <Link href={continueHref}>
                    Continue learning{" "}
                    <ArrowRightIcon className="ml-2 h-5 w-5 stroke-2" />
                  </Link>
                </Button>
              </div>
            </article>
          </div>

          <div
            className="pointer-events-none relative z-10 hidden h-full lg:block"
            aria-hidden="true"
          >
            {[
              {
                step: 5,
                className: "left-[18%] top-[55%]",
                color: "text-indigo-600",
              },
              {
                step: 6,
                className: "left-[47%] top-[40%]",
                color: "text-[#ef7448]",
              },
              {
                step: 7,
                className: "left-[67%] top-[27%]",
                color: "text-[#e7ad35]",
              },
              {
                step: 8,
                className: "left-[83%] top-[9%]",
                color: "text-emerald-600",
              },
            ].map((marker) => (
              <div
                key={marker.step}
                className={cn(
                  "absolute grid h-16 w-12 place-items-center drop-shadow-lg",
                  marker.className,
                )}
              >
                <MapPinIcon
                  className={cn(
                    "absolute h-16 w-16 fill-white stroke-[1.5]",
                    marker.color,
                  )}
                />
                <span
                  className={cn(
                    "relative -mt-4 text-sm font-black",
                    marker.color,
                  )}
                >
                  {marker.step}
                </span>
              </div>
            ))}
            <div className="absolute bottom-[7%] right-[5%] max-w-64 rounded-xl bg-slate-950/90 px-5 py-4 text-white shadow-xl backdrop-blur">
              <div className="flex gap-3">
                <SparklesIcon className="mt-0.5 h-6 w-6 shrink-0 stroke-[1.7] text-slate-100" />
                <div>
                  <p className="text-base font-semibold leading-6">
                    Keep going!
                  </p>
                  <p className="mt-1 text-sm font-normal leading-5 text-slate-200">
                    {completionCopy}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1600px] gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 xl:px-14">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <FireIconSolid className="h-5 w-5 text-[#f48a5b]" />
            <h2 className="text-base font-semibold leading-6">
              Learning streak
            </h2>
          </div>
          <p className="mt-5 text-base font-semibold leading-6">
            4 of 5 days this week
          </p>
          <p className="mt-1 text-sm font-normal leading-5 text-slate-500">
            Nice work—keep the streak alive!
          </p>
          <div className="mt-6 grid grid-cols-7 gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
              (day, index) => (
                <div key={day} className="text-center">
                  <span
                    className={cn(
                      "mx-auto grid h-9 w-9 place-items-center rounded-full border text-white",
                      index < 4
                        ? "border-emerald-500 bg-emerald-500"
                        : index === 4
                          ? "border-dashed border-slate-400 bg-white text-slate-400"
                          : "border-slate-100 bg-slate-100 text-slate-300",
                    )}
                  >
                    {index < 4 ? (
                      <CheckIcon className="h-5 w-5 stroke-[2.5]" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <span className="mt-2 block text-sm font-normal leading-5 text-slate-600">
                    {day}
                  </span>
                </div>
              ),
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <QueueListIcon className="h-5 w-5 stroke-[1.7] text-slate-600" />
                <h2 className="text-base font-semibold leading-6">Up next</h2>
              </div>
              <p className="mt-1 text-sm font-normal leading-5 text-slate-500">
                Your upcoming lessons
              </p>
            </div>
            <Link
              href="/learning/paths"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
            >
              View path <ArrowRightIcon className="h-4 w-4 stroke-[1.7]" />
            </Link>
          </div>
          <div className="mt-4 divide-y divide-slate-200">
            {upNext.map((item) => (
              <Link
                key={item.step}
                href={item.href}
                className="group flex items-center gap-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-full text-base font-semibold text-white",
                    item.color,
                  )}
                >
                  {item.step}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold leading-6 group-hover:text-indigo-700">
                    {item.title}
                  </span>
                  <span className="mt-1 block truncate text-sm font-normal leading-5 text-slate-500">
                    {item.description}
                  </span>
                </span>
                <span className="hidden text-sm font-normal leading-5 tabular-nums text-slate-500 sm:block">
                  {item.minutes} min
                </span>
                <ChevronRightIcon className="h-5 w-5 stroke-[1.7] text-slate-500 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
