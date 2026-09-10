"use client";

import React from "react";
import type { UseFormReturn } from "react-hook-form";

import type { Grade } from "@/lib/types";
import type { AddPositionFormValues } from "./add-position-form";
import type { RecruiterOption } from "./AddPositionMobileDrawerTypes";
import { fetchPositionOrganizationUnits } from './add-position-modal-data';
import type { OrganizationUnitOption } from './PositionOrganizationPathFields';

interface RecruiterApiUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface UseAddPositionMobileReferenceDataOptions {
  form: UseFormReturn<AddPositionFormValues>;
  isOpen: boolean;
}

export function useAddPositionMobileReferenceData({
  form,
  isOpen,
}: UseAddPositionMobileReferenceDataOptions) {
  const [defaultMatchCriteria, setDefaultMatchCriteria] = React.useState("");
  const [isLoadingDefaultCriteria, setIsLoadingDefaultCriteria] =
    React.useState(false);
  const [grades, setGrades] = React.useState<Grade[]>([]);
  const [availableRecruiter, setAvailableRecruiter] = React.useState<
    RecruiterOption[]
  >([]);
  const [organizationUnits, setOrganizationUnits] = React.useState<OrganizationUnitOption[]>([]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fetchReferenceData = async () => {
      setIsLoadingDefaultCriteria(true);

      try {
        const [settingsRes, gradesRes, recruitersRes, units] = await Promise.all([
          fetch("/api/settings/system-settings?keys=defaultMatchCriteria"),
          fetch("/api/settings/grades"),
          fetch("/api/users?role=Recruiter"),
          fetchPositionOrganizationUnits(),
        ]);
        setOrganizationUnits(units);

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          const defaultCriteria = data.defaultMatchCriteria || "";
          setDefaultMatchCriteria(defaultCriteria);
          if (defaultCriteria.trim() !== "") {
            form.setValue("matchCriteria", defaultCriteria);
          }
        }

        if (gradesRes.ok) {
          setGrades(await gradesRes.json());
        }

        if (recruitersRes.ok) {
          const data = await recruitersRes.json();
          const recruitersArray: RecruiterApiUser[] = data?.users || [];
          setAvailableRecruiter(
            recruitersArray.map((recruiter) => ({
              id: recruiter.id,
              name: recruiter.name,
              avatarUrl: recruiter.avatarUrl,
            })),
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoadingDefaultCriteria(false);
      }
    };

    void fetchReferenceData();
  }, [form, isOpen]);

  return {
    availableRecruiter,
    defaultMatchCriteria,
    grades,
    isLoadingDefaultCriteria,
    organizationUnits,
  };
}
