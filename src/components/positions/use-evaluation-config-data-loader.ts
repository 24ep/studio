"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import type {
  EvaluationTemplate,
  ExpertiseGroup,
  ExpertiseSkill,
  PersonalityGroup,
  PersonalityTrait,
  PositionExpertiseSkill,
  PositionPersonalityTrait,
} from "./EvaluationConfigTabParts";
import {
  fetchEvaluationExpertise,
  fetchEvaluationPersonality,
  fetchEvaluationTemplates,
  fetchPositionEvaluationTemplateId,
  fetchPositionExpertiseSkills,
  fetchPositionPersonalityTraits,
  savePositionEvaluationTemplateId,
} from "./evaluation-config-api";

interface UseEvaluationConfigDataLoaderOptions {
  positionId: string;
}

function isValidPositionId(positionId: string) {
  return Boolean(positionId && positionId !== "null" && positionId !== "undefined");
}

function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T | void> {
  return Promise.race([
    promise,
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
  ]);
}

export function useEvaluationConfigDataLoader({ positionId }: UseEvaluationConfigDataLoaderOptions) {
  const [expertiseGroups, setExpertiseGroups] = useState<ExpertiseGroup[]>([]);
  const [expertiseSkills, setExpertiseSkills] = useState<ExpertiseSkill[]>([]);
  const [positionExpertiseSkills, setPositionExpertiseSkills] = useState<PositionExpertiseSkill[]>([]);
  const [isLoadingExpertise, setIsLoadingExpertise] = useState(true);

  const [personalityGroups, setPersonalityGroups] = useState<PersonalityGroup[]>([]);
  const [personalityTraits, setPersonalityTraits] = useState<PersonalityTrait[]>([]);
  const [positionPersonalityTraits, setPositionPersonalityTraits] = useState<PositionPersonalityTrait[]>([]);
  const [isLoadingPersonality, setIsLoadingPersonality] = useState(true);

  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const loadExpertiseSkills = useCallback(async () => {
    try {
      const data = await fetchEvaluationExpertise();
      setExpertiseSkills(data.skills);
      setExpertiseGroups(data.groups);
    } catch (error) {
      console.error("Error loading expertise skills:", error);
      toast.error("Failed to load expertise skills");
    }
  }, []);

  const loadPositionExpertiseSkills = useCallback(async () => {
    try {
      const data = await fetchPositionExpertiseSkills(positionId);
      setPositionExpertiseSkills(data || []);
    } catch (error) {
      console.error("Error loading position expertise skills:", error);
      toast.error("Failed to load position expertise skills");
    }
  }, [positionId]);

  const loadPersonalityTraits = useCallback(async () => {
    try {
      const data = await fetchEvaluationPersonality();
      setPersonalityTraits(data.traits);
      setPersonalityGroups(data.groups);
    } catch (error) {
      console.error("Error loading personality traits:", error);
      toast.error("Failed to load personality traits");
    }
  }, []);

  const loadPositionPersonalityTraits = useCallback(async () => {
    try {
      const data = await fetchPositionPersonalityTraits(positionId);
      setPositionPersonalityTraits(data || []);
    } catch (error) {
      console.error("Error loading position personality traits:", error);
      toast.error("Failed to load position personality traits");
    }
  }, [positionId]);

  const loadSavedTemplateId = useCallback(async () => {
    try {
      const savedTemplateId = await fetchPositionEvaluationTemplateId(positionId);
      if (savedTemplateId) {
        setSelectedTemplateId(savedTemplateId);
      }
    } catch (error) {
      console.error("Error loading saved template ID:", error);
    }
  }, [positionId]);

  const saveTemplateId = useCallback(async (templateId: string | null) => {
    try {
      await savePositionEvaluationTemplateId(positionId, templateId);
    } catch (error) {
      console.error("Error saving template ID:", error);
    }
  }, [positionId]);

  useEffect(() => {
    const loadData = async () => {
      if (!isValidPositionId(positionId)) {
        console.warn("Invalid positionId:", positionId);
        setIsLoadingExpertise(false);
        setIsLoadingPersonality(false);
        setIsLoadingTemplates(false);
        return;
      }

      setIsLoadingExpertise(true);
      setIsLoadingPersonality(true);
      setIsLoadingTemplates(true);

      try {
        await Promise.all([
          withTimeout(loadExpertiseSkills()),
          withTimeout(loadPositionExpertiseSkills()),
          withTimeout(loadPersonalityTraits()),
          withTimeout(loadPositionPersonalityTraits()),
        ]);
        setTemplates(await fetchEvaluationTemplates());
        await loadSavedTemplateId();
      } finally {
        setIsLoadingExpertise(false);
        setIsLoadingPersonality(false);
        setIsLoadingTemplates(false);
      }
    };

    loadData();
  }, [
    loadExpertiseSkills,
    loadPersonalityTraits,
    loadPositionExpertiseSkills,
    loadPositionPersonalityTraits,
    loadSavedTemplateId,
    positionId,
  ]);

  return {
    expertiseGroups,
    expertiseSkills,
    positionExpertiseSkills,
    isLoadingExpertise,
    personalityGroups,
    personalityTraits,
    positionPersonalityTraits,
    isLoadingPersonality,
    templates,
    isLoadingTemplates,
    selectedTemplateId,
    setSelectedTemplateId,
    loadPositionExpertiseSkills,
    loadPositionPersonalityTraits,
    saveTemplateId,
  };
}
