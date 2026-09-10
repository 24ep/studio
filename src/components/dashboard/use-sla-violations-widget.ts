"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { readJsonObject } from "../../lib/response-json";
import type {
  SLAHeadcountData,
  SLAPositionData,
  SLAStatistics,
  SLAViolationNotification,
  PositionWithoutSLA,
} from "@/lib/slaNotificationService";
import {
  buildSLAHeadcountSummaryForPosition,
  filterSLAPositionsBySeverity,
  getSLAResponseJsonArray,
  getSLAStatistics,
  type SLAHeadcountSummaryEntry,
} from "./sla-violations-widget-utils";

export type { SLAHeadcountSummaryEntry } from "./sla-violations-widget-utils";

interface UseSlaViolationsWidgetOptions {
  recruiterId?: string;
  onDataUpdate?: () => void;
}

export function useSlaViolationsWidget({
  recruiterId,
  onDataUpdate,
}: UseSlaViolationsWidgetOptions) {
  const { data: session } = useSession();
  const [violations, setViolations] = useState<SLAViolationNotification[]>([]);
  const [allPositions, setAllPositions] = useState<SLAPositionData[]>([]);
  const [statistics, setStatistics] = useState<SLAStatistics | null>(null);
  const [headcounts, setHeadcounts] = useState<SLAHeadcountData[]>([]);
  const [positionsWithoutSLA, setPositionsWithoutSLA] = useState<PositionWithoutSLA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [isPositionDrawerOpen, setIsPositionDrawerOpen] = useState(false);

  const actualRecruiterId = recruiterId === "current" ? session?.user?.id : recruiterId;

  const fetchSLAData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = new URL("/api/sla-violations", window.location.origin);
      if (actualRecruiterId) {
        url.searchParams.set("recruiterId", actualRecruiterId);
      }
      url.searchParams.set("includeAll", "true");
      url.searchParams.set("includeStats", "true");
      url.searchParams.set("includeHeadcounts", "true");
      url.searchParams.set("includeWithoutSLA", "true");

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch SLA data");
      }

      const data = await readJsonObject(response);
      setViolations(getSLAResponseJsonArray<SLAViolationNotification>(data, "violations"));
      setAllPositions(getSLAResponseJsonArray<SLAPositionData>(data, "allPositions"));
      setStatistics(getSLAStatistics(data.statistics));
      setHeadcounts(getSLAResponseJsonArray<SLAHeadcountData>(data, "headcounts"));
      setPositionsWithoutSLA(getSLAResponseJsonArray<PositionWithoutSLA>(data, "positionsWithoutSLA"));
    } catch (err) {
      console.error("Error fetching SLA data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch SLA data");
    } finally {
      setIsLoading(false);
    }
  }, [actualRecruiterId]);

  useEffect(() => {
    if (recruiterId === "current" && !session?.user?.id) {
      return;
    }
    fetchSLAData();
  }, [fetchSLAData, recruiterId, session]);

  useEffect(() => {
    if (onDataUpdate) {
      fetchSLAData();
    }
  }, [fetchSLAData, onDataUpdate]);

  const filteredPositions = filterSLAPositionsBySeverity(allPositions, filterSeverity);

  const getCountsForPosition = useCallback((positionId: string): SLAHeadcountSummaryEntry[] => {
    return buildSLAHeadcountSummaryForPosition(headcounts, positionId);
  }, [headcounts]);

  const openPosition = (positionId: string) => {
    setSelectedPositionId(positionId);
    setIsPositionDrawerOpen(true);
  };

  return {
    actualRecruiterId,
    error,
    fetchSLAData,
    filteredPositions,
    filterSeverity,
    getCountsForPosition,
    hasHeadcounts: headcounts.length > 0,
    isLoading,
    isPositionDrawerOpen,
    openPosition,
    positionsWithoutSLA,
    selectedPositionId,
    setFilterSeverity,
    setIsPositionDrawerOpen,
    statistics,
    violations,
  };
}
