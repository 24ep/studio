"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { useToast } from "@/hooks/use-toast";
import type { AddPositionFormValues } from "./add-position-form";
import { requestGeneratedDescription } from "./add-position-description-api";
import {
  getMissingJobDescriptionFields,
  hasVisibleJobDescription,
} from "./add-position-modal-utils";

export function useAddPositionDescriptionGenerator(form: UseFormReturn<AddPositionFormValues>) {
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [showReplaceConfirmation, setShowReplaceConfirmation] = useState(false);
  const descriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { error: showError, success: showSuccess } = useToast();

  const watchedTitle = form.watch("title");
  const watchedDepartment = form.watch("department");
  const watchedPositionLevel = form.watch("positionLevel");
  const canGenerateDescription = useMemo(() => (
    getMissingJobDescriptionFields({
      department: watchedDepartment,
      positionLevel: watchedPositionLevel,
      title: watchedTitle,
    }).length === 0
  ), [watchedDepartment, watchedPositionLevel, watchedTitle]);

  useEffect(() => () => {
    if (descriptionTimeoutRef.current) {
      clearTimeout(descriptionTimeoutRef.current);
    }
  }, []);

  const scheduleDescriptionValidation = (generatedDescription: string) => {
    if (descriptionTimeoutRef.current) {
      clearTimeout(descriptionTimeoutRef.current);
    }

    descriptionTimeoutRef.current = setTimeout(() => {
      if (form.getValues("description") === generatedDescription) {
        void form.trigger("description");
      }
    }, 100);
  };

  const performJobDescriptionGeneration = async (
    title: string,
    department: string,
    positionLevel: string,
  ) => {
    setIsGeneratingDescription(true);
    try {
      const generatedDescription = await requestGeneratedDescription({
        department,
        existingDescription: form.getValues("description") || "",
        positionLevel,
        title,
      });

      form.setValue("description", generatedDescription);
      scheduleDescriptionValidation(generatedDescription);
      showSuccess("Job description generated successfully!");
    } catch (error) {
      console.error("Error generating job description:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate job description. Please try again.";
      showError(errorMessage);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const generateJobDescription = async () => {
    const title = form.getValues("title");
    const department = form.getValues("department");
    const positionLevel = form.getValues("positionLevel");
    const missingFields = getMissingJobDescriptionFields({ department, positionLevel, title });

    if (missingFields.length > 0) {
      showError(`Please fill in the following fields first: ${missingFields.join(", ")}`);
      return;
    }

    if (hasVisibleJobDescription(form.getValues("description"))) {
      setShowReplaceConfirmation(true);
      return;
    }

    await performJobDescriptionGeneration(title, department, positionLevel || "");
  };

  const handleConfirmReplace = async () => {
    const title = form.getValues("title");
    const department = form.getValues("department");
    const positionLevel = form.getValues("positionLevel");

    setShowReplaceConfirmation(false);
    await performJobDescriptionGeneration(title, department, positionLevel || "");
  };

  return {
    canGenerateDescription,
    generateJobDescription,
    handleConfirmReplace,
    isGeneratingDescription,
    setShowReplaceConfirmation,
    showReplaceConfirmation,
  };
}
