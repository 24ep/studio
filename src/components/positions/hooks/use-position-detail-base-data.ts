"use client";

import { useCallback, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { ApplicantSource, CustomFieldValue, Grade, Position, RecruitmentStage, UserProfile } from "@/lib/types";
import { getJsonErrorMessage, readJsonObject, readJsonOrFallback } from "@/lib/response-json";
import type { EditPositionFormValues } from "../position-edit-form";
import { positionDetailDemo } from "../position-detail-demo-data";
import { getPositionEditFormDefaults } from "../position-detail-drawer-utils";
import {
  normalizeArrayPayload,
  normalizeRecruiterOptions,
  updatePositionCustomField,
} from "./position-detail-base-data-utils";

interface UsePositionDetailBaseDataOptions {
  positionId: string | null;
  sessionStatus: string;
  form: UseFormReturn<EditPositionFormValues>;
}

export function usePositionDetailBaseData({
  positionId,
  sessionStatus,
  form,
}: UsePositionDetailBaseDataOptions) {
  const [position, setPosition] = useState<Position | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDrawerReady, setIsDrawerReady] = useState(false);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [headcountsTotal, setHeadcountsTotal] = useState(0);
  const [recruitmentStages, setRecruitmentStages] = useState<RecruitmentStage[]>([]);
  const [availableRecruiters, setAvailableRecruiters] = useState<Pick<UserProfile, "id" | "name" | "avatarUrl" | "personalColor">[]>([]);
  const [availableSources, setAvailableSources] = useState<ApplicantSource[]>([]);

  const fetchPosition = useCallback(async () => {
    if (!positionId) return;

    if (positionId === "preview") {
      setFetchError(null);
      setPosition(positionDetailDemo);
      form.reset(getPositionEditFormDefaults(positionDetailDemo));
      setIsDrawerReady(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      const response = await fetch(`/api/positions/${positionId}`);

      if (!response.ok) {
        throw new Error(getJsonErrorMessage(await readJsonObject(response), "Failed to fetch position"));
      }

      const data = await readJsonOrFallback<Position | null>(response, null);
      if (!data) {
        throw new Error("Failed to fetch position");
      }
      setPosition(data);
      form.reset(getPositionEditFormDefaults(data));
      setIsDrawerReady(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not load position.";
      setFetchError(errorMessage);
      setPosition(null);
    } finally {
      setIsLoading(false);
    }
  }, [positionId, form]);

  const fetchGrades = useCallback(async () => {
    try {
      const response = await fetch("/api/settings/grades");
      if (response.ok) {
        setGrades(normalizeArrayPayload<Grade>(await readJsonOrFallback<unknown>(response, [])));
      }
    } catch {
      // Grades are non-critical drawer metadata.
    }
  }, []);

  const fetchHeadcountCount = useCallback(async () => {
    if (!positionId) return;

    try {
      const response = await fetch(`/api/headcount?positionId=${positionId}`);
      if (!response.ok) throw new Error("Failed to fetch headcount count");

      const data = await readJsonOrFallback<unknown>(response, []);
      setHeadcountsTotal(Array.isArray(data) ? data.length : 0);
    } catch {
      setHeadcountsTotal(0);
    }
  }, [positionId]);

  const fetchRecruitmentStages = useCallback(async () => {
    if (sessionStatus !== "authenticated") return;

    try {
      const response = await fetch("/api/recruitment-stages");
      if (!response.ok) throw new Error("Failed to fetch recruitment stages");

      setRecruitmentStages(normalizeArrayPayload<RecruitmentStage>(
        await readJsonOrFallback<unknown>(response, [])
      ));
    } catch (error) {
      console.error("Error fetching recruitment stages:", error);
    }
  }, [sessionStatus]);

  const fetchRecruiters = useCallback(async () => {
    try {
      const response = await fetch("/api/users?role=recruiter");
      if (response.ok) {
        setAvailableRecruiters(normalizeRecruiterOptions(await readJsonOrFallback<unknown>(response, [])));
      }
    } catch (error) {
      console.error("Failed to fetch recruiters", error);
    }
  }, []);

  const fetchSources = useCallback(async () => {
    try {
      const response = await fetch("/api/settings/sources");
      if (response.ok) {
        setAvailableSources(normalizeArrayPayload<ApplicantSource>(
          await readJsonOrFallback<unknown>(response, [])
        ));
      }
    } catch (error) {
      console.error("Failed to fetch sources", error);
    }
  }, []);

  const handleCustomFieldChange = useCallback((fieldCode: string, value: CustomFieldValue) => {
    setPosition(previous => updatePositionCustomField(previous, fieldCode, value));
  }, []);

  const resetBaseData = useCallback(() => {
    setPosition(null);
    setHeadcountsTotal(0);
    setFetchError(null);
    setIsDrawerReady(false);
    setRecruitmentStages([]);
    form.reset();
  }, [form]);

  return {
    position,
    setPosition,
    isLoading,
    fetchError,
    isDrawerReady,
    grades,
    headcountsTotal,
    recruitmentStages,
    availableRecruiters,
    availableSources,
    fetchPosition,
    fetchGrades,
    fetchHeadcountCount,
    fetchRecruitmentStages,
    fetchRecruiters,
    fetchSources,
    handleCustomFieldChange,
    resetBaseData,
  };
}
