import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckBadgeIcon,
  CheckIcon,
  MapPinIcon,
  PlusIcon,
  SparklesIcon,
  TrophyIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LearningView =
  | "overview"
  | "courses"
  | "paths"
  | "achievements"
  | "career-explorer"
  | "certificates"
  | "trusted-certificates"
  | "onboarding";

export const learningViewHeaders: Record<
  LearningView,
  { title: string; description: string }
> = {
  overview: {
    title: "Learning overview",
    description:
      "Track courses, enrollments, certifications, and learning progress in one place.",
  },
  courses: {
    title: "Courses",
    description:
      "Build and manage the course catalog available to your workforce.",
  },
  paths: {
    title: "Learning paths",
    description:
      "Group courses into structured development journeys for employees.",
  },
  achievements: {
    title: "Achievements",
    description:
      "Celebrate completed learning, milestones, and earned recognition.",
  },
  "career-explorer": {
    title: "Career Explorer",
    description:
      "Explore realistic career paths that build from your current role and strengths.",
  },
  certificates: {
    title: "Employee certificates",
    description:
      "Record and monitor employee certifications, validity, and renewal dates.",
  },
  "trusted-certificates": {
    title: "Trusted certificates",
    description:
      "Manage verified credentials and the organizations that issued them.",
  },
  onboarding: {
    title: "Learning onboarding",
    description:
      "Guide new employees through required learning and onboarding tasks.",
  },
};

const learningJourneyStops = [
  { view: "courses" as const, label: "Explore", href: "/learning/courses" },
  { view: "paths" as const, label: "Journey", href: "/learning/paths" },
  {
    view: "achievements" as const,
    label: "Celebrate",
    href: "/learning/achievements",
  },
  {
    view: "certificates" as const,
    label: "Credentials",
    href: "/learning/certificates",
  },
];

const learningJourneyCopy: Record<
  Exclude<LearningView, "overview">,
  {
    kicker: string;
    chapter: string;
    encouragement: string;
    nextLabel: string;
    nextHref: string;
  }
> = {
  onboarding: {
    kicker: "Base Camp",
    chapter: "Chapter 1",
    encouragement: "Turn every first week into a confident beginning.",
    nextLabel: "Explore courses",
    nextHref: "/learning/courses",
  },
  courses: {
    kicker: "Explore new skills",
    chapter: "Chapter 1",
    encouragement: "Pick a skill, follow your curiosity, and keep moving.",
    nextLabel: "Build a learning path",
    nextHref: "/learning/paths",
  },
  paths: {
    kicker: "The Trail Map",
    chapter: "Chapter 2",
    encouragement: "Small, ordered steps make ambitious growth feel possible.",
    nextLabel: "See achievements",
    nextHref: "/learning/achievements",
  },
  achievements: {
    kicker: "The Summit",
    chapter: "Chapter 3",
    encouragement: "Every finished lesson leaves a mark worth celebrating.",
    nextLabel: "View credentials",
    nextHref: "/learning/certificates",
  },
  "career-explorer": {
    kicker: "Choose your route",
    chapter: "Career growth",
    encouragement:
      "Start with your strengths and explore where they could take you next.",
    nextLabel: "View learning paths",
    nextHref: "/learning/paths",
  },
  certificates: {
    kicker: "Expedition Passport",
    chapter: "Chapter 4",
    encouragement:
      "Keep hard-earned skills visible, trusted, and ready to share.",
    nextLabel: "Trusted credentials",
    nextHref: "/learning/trusted-certificates",
  },
  "trusted-certificates": {
    kicker: "Verified Collection",
    chapter: "Credential desk",
    encouragement: "A clear source of truth for qualifications that matter.",
    nextLabel: "Back to Learning Home",
    nextHref: "/learning",
  },
};

export function LearningJourneyHeader({
  view,
  title,
  description,
  primaryLabel,
  onPrimaryAction,
  onAiCreate,
}: {
  view: Exclude<LearningView, "overview">;
  title: string;
  description: string;
  primaryLabel: string;
  onPrimaryAction: () => void;
  onAiCreate?: () => void;
}) {
  const copy = learningJourneyCopy[view];
  const activeStop = learningJourneyStops.findIndex(
    (stop) => stop.view === view,
  );
  const HeaderIcon =
    view === "onboarding"
      ? UserGroupIcon
      : view === "courses"
        ? BookOpenIcon
        : view === "paths"
          ? MapPinIcon
          : view === "achievements"
            ? TrophyIcon
            : CheckBadgeIcon;

  return (
    <header className="relative isolate overflow-hidden rounded-[24px] border border-[#dbe3eb] bg-[#f8f4ec] shadow-[0_18px_45px_rgba(30,48,87,0.09)] dark:border-zinc-800 dark:bg-zinc-900">
      <Image
        src="/learning/adventure-trail-hero.png"
        alt=""
        fill
        priority
        unoptimized
        sizes="100vw"
        className="z-0 object-cover object-[62%_48%] dark:brightness-[.58] dark:saturate-[.72]"
      />
      <div
        className="absolute inset-0 z-[1] bg-gradient-to-r from-[#fbfaf6] via-[#fbfaf6]/95 to-[#fbfaf6]/10 dark:from-zinc-950 dark:via-zinc-950/92 dark:to-zinc-950/5"
        aria-hidden="true"
      />

      <div className="relative z-10 grid min-h-[286px] lg:grid-cols-[minmax(0,1fr)_42%]">
        <div className="flex flex-col justify-center px-6 py-9 sm:px-8 lg:px-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-[#5873a4] dark:text-blue-300">
            <span>{copy.chapter}</span>
            <span className="h-1 w-1 rounded-full bg-current opacity-50" />
            <span>{copy.kicker}</span>
          </div>
          <h1 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.04] tracking-[-0.045em] text-[#172033] dark:text-zinc-50">
            {title}
          </h1>
          <p className="mt-3 max-w-xl text-base leading-6 text-[#66758a] dark:text-zinc-300">
            {description}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={onPrimaryAction}
              className="h-11 rounded-lg bg-[#316be8] px-5 font-semibold shadow-md shadow-indigo-950/15 transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#285dce]"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              {primaryLabel}
            </Button>
            {onAiCreate && (
              <Button
                type="button"
                variant="outline"
                onClick={onAiCreate}
                className="h-11 rounded-lg border-[#b9c9d8] bg-white/75 px-4 font-semibold text-[#244b44] shadow-sm backdrop-blur-sm hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/75 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                <SparklesIcon className="mr-2 h-4 w-4 text-[#316be8]" />
                Create with AI
              </Button>
            )}
            <Link
              href={copy.nextHref}
              className="group inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-[#3e5169] transition-colors hover:bg-white/70 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
            >
              {copy.nextLabel}
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div className="relative hidden items-center justify-center px-8 lg:flex">
          <div
            className="absolute left-[18%] top-[34%] h-24 border-l-2 border-dashed border-white/85"
            aria-hidden="true"
          />
          <div className="relative -mt-8 grid h-20 w-16 place-items-center text-[#316be8] drop-shadow-lg">
            <MapPinIcon className="absolute h-20 w-20 fill-white stroke-[1.5]" />
            <HeaderIcon className="relative -mt-5 h-7 w-7 stroke-[1.7]" />
          </div>
          <p className="absolute bottom-5 right-6 max-w-[250px] rounded-xl bg-[#172033]/90 px-4 py-3 text-sm font-medium leading-5 text-white shadow-xl backdrop-blur-sm">
            {copy.encouragement}
          </p>
        </div>
      </div>

      <nav
        aria-label="Learning journey"
        className="relative z-10 flex overflow-x-auto border-t border-slate-200/80 bg-white/95 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/95 sm:px-6"
      >
        {learningJourneyStops.map((stop, index) => {
          const isActive = stop.view === view;
          const isComplete =
            activeStop > index || view === "trusted-certificates";
          return (
            <React.Fragment key={stop.view}>
              {index > 0 && (
                <span
                  className={cn(
                    "mt-3 h-px min-w-4 flex-1 border-t border-dashed",
                    isComplete || isActive
                      ? "border-[#6e8ed6]"
                      : "border-slate-300 dark:border-zinc-700",
                  )}
                  aria-hidden="true"
                />
              )}
              <Link
                href={stop.href}
                aria-current={isActive ? "page" : undefined}
                className="group flex shrink-0 items-center gap-2 px-2 text-xs font-semibold text-slate-500 dark:text-zinc-400"
              >
                <span
                  className={cn(
                    "grid h-6 w-6 place-items-center rounded-full border text-[10px] transition-transform duration-200 group-hover:scale-110",
                    isActive
                      ? "border-[#316be8] bg-[#316be8] text-white shadow-sm shadow-indigo-500/30"
                      : isComplete
                        ? "border-[#4db78a] bg-[#4db78a] text-white"
                        : "border-slate-300 bg-white dark:border-zinc-600 dark:bg-zinc-900",
                  )}
                >
                  {isComplete ? (
                    <CheckIcon className="h-3.5 w-3.5 stroke-[2.5]" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(isActive && "text-slate-950 dark:text-white")}
                >
                  {stop.label}
                </span>
              </Link>
            </React.Fragment>
          );
        })}
      </nav>
    </header>
  );
}
