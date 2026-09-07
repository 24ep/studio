"use client";

import * as React from "react";
import { ArrowPathIcon, TrophyIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { AchievementJourney } from "./AchievementJourney";
import { learningRecords } from "./achievement-view-model";
import type {
  CareerSnapshot,
  LearningRecord,
  LearningResponse,
} from "./learning-workspace-model";

const learningRequest = (url: string) =>
  fetch(url, {
    credentials: "include",
    cache: "no-store",
  });

export function AchievementsPageClient() {
  const [courses, setCourses] = React.useState<LearningRecord[]>([]);
  const [enrollments, setEnrollments] = React.useState<LearningRecord[]>([]);
  const [certificates, setCertificates] = React.useState<LearningRecord[]>([]);
  const [career, setCareer] = React.useState<CareerSnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [enrollmentResponse, courseResponse, certificateResponse] =
        await Promise.all([
          learningRequest("/api/hr/learning"),
          learningRequest("/api/hr/learning?view=courses"),
          learningRequest("/api/hr/learning?view=certifications"),
        ]);

      if (!enrollmentResponse.ok) {
        throw new Error("Unable to load learning data.");
      }

      const [enrollmentPayload, coursePayload, certificatePayload] =
        await Promise.all([
          enrollmentResponse.json() as Promise<LearningResponse>,
          courseResponse.ok
            ? (courseResponse.json() as Promise<LearningResponse>)
            : Promise.resolve({} as LearningResponse),
          certificateResponse.ok
            ? (certificateResponse.json() as Promise<LearningResponse>)
            : Promise.resolve({} as LearningResponse),
        ]);

      setEnrollments(learningRecords(enrollmentPayload));
      setCourses(learningRecords(coursePayload));
      setCertificates(learningRecords(certificatePayload));

      try {
        const careerResponse = await learningRequest(
          "/api/learning/career-explorer",
        );
        if (!careerResponse.ok) {
          setCareer(null);
        } else {
          const payload = (await careerResponse.json()) as {
            data?: CareerSnapshot | null;
          };
          setCareer(payload.data || null);
        }
      } catch {
        setCareer(null);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load learning achievements.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <main className="grid min-h-[420px] place-items-center bg-[#fbfaf6] px-6 text-[#15213a] dark:bg-[#151924] dark:text-[#f5f3ed]">
        <div className="text-center">
          <ArrowPathIcon
            className="mx-auto h-7 w-7 animate-spin text-indigo-600 dark:text-indigo-300"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-semibold">Loading achievements…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="grid min-h-[420px] place-items-center bg-[#fbfaf6] px-6 text-[#15213a] dark:bg-[#151924] dark:text-[#f5f3ed]">
        <div className="max-w-md text-center" role="alert">
          <TrophyIcon
            className="mx-auto h-8 w-8 text-amber-600 dark:text-amber-300"
            aria-hidden="true"
          />
          <h1 className="mt-3 text-lg font-semibold">
            Achievements are temporarily unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
            {error}
          </p>
          <Button className="mt-5" onClick={() => void load()}>
            <ArrowPathIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
        </div>
      </main>
    );
  }

  return (
    <AchievementJourney
      courses={courses}
      enrollments={enrollments}
      certificates={certificates}
      career={career}
    />
  );
}
