"use client";

import { useCallback, useEffect, useState } from "react";

import type { ApplicantSource } from "@/lib/types";
import { fetchBulkUploadSources } from "./bulk-upload-cvs-api";

export function useBulkUploadSources(isOpen: boolean) {
  const [availableSources, setAvailableSources] = useState<ApplicantSource[]>([]);

  const fetchApplicantSources = useCallback(async () => {
    try {
      setAvailableSources(await fetchBulkUploadSources());
    } catch (error) {
      console.error("Failed to fetch Applicant sources:", error);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void fetchApplicantSources();
    }
  }, [isOpen, fetchApplicantSources]);

  return availableSources;
}
