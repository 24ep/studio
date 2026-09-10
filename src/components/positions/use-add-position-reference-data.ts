"use client";

import { useCallback, useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { Grade } from "@/lib/types";
import type { AddPositionFormValues } from "./add-position-form";
import { fetchAddPositionGrades, fetchAddPositionRecruiters, fetchDefaultMatchCriteria, fetchPositionOrganizationUnits } from "./add-position-modal-data";
import type { AddPositionRecruiterOption } from "./add-position-modal-utils";
import type { OrganizationUnitOption } from './PositionOrganizationPathFields';

const DEVELOPMENT_RECRUITERS: AddPositionRecruiterOption[] = [
  { id: '55555555-5555-4555-8555-555555555555', name: 'Sarah Connor' },
  { id: '66666666-6666-4666-8666-666666666666', name: 'David Miller' },
];

const DEVELOPMENT_ORGANIZATION_UNITS: OrganizationUnitOption[] = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Engineering', parentId: null, unitType: 'division' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Product Engineering', parentId: '11111111-1111-4111-8111-111111111111', unitType: 'department' },
  { id: '33333333-3333-4333-8333-333333333333', name: 'Web Platform', parentId: '22222222-2222-4222-8222-222222222222', unitType: 'section' },
  { id: '44444444-4444-4444-8444-444444444444', name: 'Bangkok', parentId: '33333333-3333-4333-8333-333333333333', unitType: 'unit' },
];

function withDevelopmentFallback<T>(items: T[], fallback: T[]) {
  return items.length > 0 || process.env.NODE_ENV !== 'development' ? items : fallback;
}

export function useAddPositionReferenceData({
  form,
  isOpen,
}: {
  form: UseFormReturn<AddPositionFormValues>;
  isOpen: boolean;
}) {
  const [defaultMatchCriteria, setDefaultMatchCriteria] = useState("");
  const [isLoadingDefaultCriteria, setIsLoadingDefaultCriteria] = useState(false);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [availableRecruiter, setAvailableRecruiter] = useState<AddPositionRecruiterOption[]>([]);
  const [organizationUnits, setOrganizationUnits] = useState<OrganizationUnitOption[]>([]);

  const loadDefaultMatchCriteria = useCallback(async () => {
    setIsLoadingDefaultCriteria(true);
    try {
      const defaultCriteria = await fetchDefaultMatchCriteria();
      setDefaultMatchCriteria(defaultCriteria);
      if (defaultCriteria.trim() !== "") {
        form.setValue("matchCriteria", defaultCriteria);
      }
    } catch (error) {
      console.error("Error fetching default match criteria:", error);
    } finally {
      setIsLoadingDefaultCriteria(false);
    }
  }, [form]);

  const loadGrades = useCallback(async () => {
    try {
      setGrades(await fetchAddPositionGrades());
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  }, []);

  const loadRecruiters = useCallback(async () => {
    try {
      setAvailableRecruiter(withDevelopmentFallback(await fetchAddPositionRecruiters(), DEVELOPMENT_RECRUITERS));
    } catch (error) {
      console.error("Error fetching recruiters:", error);
      setAvailableRecruiter(withDevelopmentFallback([], DEVELOPMENT_RECRUITERS));
    }
  }, []);

  const loadOrganizationUnits = useCallback(async () => {
    try {
      setOrganizationUnits(withDevelopmentFallback(await fetchPositionOrganizationUnits(), DEVELOPMENT_ORGANIZATION_UNITS));
    } catch (error) {
      console.error("Error fetching organization units:", error);
      setOrganizationUnits(withDevelopmentFallback([], DEVELOPMENT_ORGANIZATION_UNITS));
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void loadDefaultMatchCriteria();
    void loadGrades();
    void loadRecruiters();
    void loadOrganizationUnits();
  }, [isOpen, loadDefaultMatchCriteria, loadGrades, loadOrganizationUnits, loadRecruiters]);

  return {
    availableRecruiter,
    defaultMatchCriteria,
    grades,
    isLoadingDefaultCriteria,
    organizationUnits,
  };
}
