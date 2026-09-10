"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fallbackExpertiseGroups,
  fallbackExpertiseSkills,
  fallbackPersonalityGroups,
  fallbackPersonalityTraits,
  fetchSkillTemplatesData,
  type SkillTemplatesData,
} from "./skill-templates-api";

const EMPTY_SKILL_TEMPLATES_DATA: SkillTemplatesData = {
  groups: [],
  personalityGroups: [],
  personalityTraits: [],
  skills: [],
  templates: [],
};

function buildSkillTemplatesFallbackData(currentData: SkillTemplatesData): SkillTemplatesData {
  return {
    ...currentData,
    groups: fallbackExpertiseGroups,
    personalityGroups: fallbackPersonalityGroups,
    personalityTraits: fallbackPersonalityTraits,
    skills: fallbackExpertiseSkills,
  };
}

export function useSkillTemplatesData() {
  const [data, setData] = useState<SkillTemplatesData>(EMPTY_SKILL_TEMPLATES_DATA);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setData(await fetchSkillTemplatesData());
    } catch (error) {
      console.error("Error fetching data:", error);
      setData(buildSkillTemplatesFallbackData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    fetchData,
    loading,
  };
}
