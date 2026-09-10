"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchUploadQueuePositions,
  fetchUploadQueueSources,
  type PositionOption,
  type SourceOption,
} from "./applicant-import-upload-queue-api";

export function useApplicantImportUploadQueueReferenceData() {
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [availableSources, setAvailableSources] = useState<SourceOption[]>([]);

  const fetchPositions = useCallback(async () => {
    try {
      setPositions(await fetchUploadQueuePositions());
    } catch (error) {
      console.error("Failed to fetch positions:", error);
    }
  }, []);

  const fetchSources = useCallback(async () => {
    try {
      setAvailableSources(await fetchUploadQueueSources());
    } catch (error) {
      console.error("Failed to fetch sources:", error);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
    fetchSources();
  }, [fetchPositions, fetchSources]);

  return {
    availableSources,
    positions,
  };
}
