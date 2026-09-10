"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getRecruitmentStageNameClient } from "@/lib/recruitmentStageUtils";
import type { Applicant } from "@/lib/types";

export function useManageTransitionLifecycle(isOpen: boolean) {
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      clearCloseTimeout();
    };
  }, [clearCloseTimeout]);

  useEffect(() => {
    if (!isOpen) {
      clearCloseTimeout();
    }
  }, [clearCloseTimeout, isOpen]);

  return {
    clearCloseTimeout,
    closeTimeoutRef,
    isMountedRef,
  };
}

export function useCurrentTransitionStageName({
  applicant,
  isOpen,
}: {
  applicant: Applicant | null;
  isOpen: boolean;
}) {
  const [currentStageName, setCurrentStageName] = useState("");

  useEffect(() => {
    let isActive = true;

    const fetchStageName = async () => {
      if (!isOpen || !applicant) {
        setCurrentStageName("");
        return;
      }

      const idOrName = applicant.statusId || applicant.status || "";
      if (!idOrName) {
        setCurrentStageName("");
        return;
      }

      try {
        const name = await getRecruitmentStageNameClient(idOrName);
        if (isActive) {
          setCurrentStageName(name || "");
        }
      } catch (error) {
        console.error("Error fetching stage name:", error);
        if (isActive) {
          setCurrentStageName(idOrName);
        }
      }
    };

    fetchStageName();

    return () => {
      isActive = false;
    };
  }, [applicant, isOpen]);

  return currentStageName;
}
