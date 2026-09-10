"use client";

import React from "react";

import {
  fetchMyTasksMetadata,
  fetchMyTasksTotalApplicants,
  fetchTaskboardApplicantList,
} from "@/components/tasks/my-tasks-page-data";
import {
  getTaskboardApplicantsEndpoint,
  type MyTasksFilters,
  type MyTasksRecruiter,
  type MyTasksStage,
  type TaskboardApplicant,
} from "@/components/tasks/my-tasks-page-utils";

interface UseMyTasksPageDataLoadersOptions {
  filters: MyTasksFilters;
  searchTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  setApplicants: React.Dispatch<React.SetStateAction<TaskboardApplicant[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setMetadataLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  setRecruiter: React.Dispatch<React.SetStateAction<MyTasksRecruiter[]>>;
  setStages: React.Dispatch<React.SetStateAction<MyTasksStage[]>>;
  setTotalApplicants: React.Dispatch<React.SetStateAction<number>>;
}

export function useMyTasksPageDataLoaders({
  filters,
  searchTimeoutRef,
  setApplicants,
  setLoading,
  setMetadataLoaded,
  setRecruiter,
  setStages,
  setTotalApplicants,
}: UseMyTasksPageDataLoadersOptions) {
  React.useEffect(() => {
    const fetchMeta = async () => {
      setLoading(true);
      try {
        const metadata = await fetchMyTasksMetadata();
        setStages(metadata.stages);
        setRecruiter(metadata.recruiters);
      } finally {
        setMetadataLoaded(true);
        setLoading(false);
      }
    };

    void fetchMeta();
  }, [setLoading, setMetadataLoaded, setRecruiter, setStages]);

  React.useEffect(() => {
    const fetchTotalCount = async () => {
      setTotalApplicants(await fetchMyTasksTotalApplicants());
    };

    void fetchTotalCount();
  }, [setTotalApplicants]);

  React.useEffect(() => {
    const fetchApplicants = async () => {
      setLoading(true);
      try {
        setApplicants(await fetchTaskboardApplicantList(
          "/api/taskboard/applicants?limit=50000&page=1",
          "initial",
        ));
      } finally {
        setLoading(false);
      }
    };

    void fetchApplicants();
  }, [setApplicants, setLoading]);

  React.useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      const fetchApplicants = async () => {
        setLoading(true);
        try {
          setApplicants(await fetchTaskboardApplicantList(
            getTaskboardApplicantsEndpoint(filters),
            "filtered",
          ));
        } finally {
          setLoading(false);
        }
      };

      void fetchApplicants();
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters, searchTimeoutRef, setApplicants, setLoading]);
}
