"use client";

import React from "react";
import type { UseFormReturn } from "react-hook-form";

import { useToast } from "@/hooks/use-toast";
import { getJsonString, readJsonObject, type JsonObject } from "@/lib/response-json";
import type { AddPositionFormValues } from "./add-position-form";
import { hasVisibleJobDescription } from "./add-position-modal-utils";

interface UseAddPositionMobileDescriptionOptions {
  form: UseFormReturn<AddPositionFormValues>;
}

function getMissingDescriptionFields({
  department,
  positionLevel,
  title,
}: Pick<AddPositionFormValues, "department" | "positionLevel" | "title">) {
  const missingFields: string[] = [];

  if (!title?.trim()) missingFields.push("Position Title");
  if (!department?.trim()) missingFields.push("Department");
  if (!positionLevel?.trim()) missingFields.push("Position Level");

  return missingFields;
}

function getGenerateDescriptionErrorMessage(response: Response, data: JsonObject) {
  const error = getJsonString(data, "error");
  if (response.status === 503 && error?.includes("API Key")) {
    return "AI features are not configured. Please configure an AI provider and API key in System Settings > AI API Keys.";
  }

  return error || "Failed to generate job description";
}

export function useAddPositionMobileDescription({
  form,
}: UseAddPositionMobileDescriptionOptions) {
  const [isGeneratingDescription, setIsGeneratingDescription] =
    React.useState(false);
  const [showReplaceConfirmation, setShowReplaceConfirmation] =
    React.useState(false);
  const descriptionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const { error: showError, success: showSuccess } = useToast();

  const watchedTitle = form.watch("title");
  const watchedDepartment = form.watch("department");
  const watchedPositionLevel = form.watch("positionLevel");
  const canGenerateDescription = Boolean(
    watchedTitle?.trim() &&
      watchedDepartment?.trim() &&
      watchedPositionLevel?.trim(),
  );

  React.useEffect(() => {
    return () => {
      if (descriptionTimeoutRef.current) {
        clearTimeout(descriptionTimeoutRef.current);
      }
    };
  }, []);

  const performJobDescriptionGeneration = React.useCallback(
    async (title: string, department: string, positionLevel: string) => {
      setIsGeneratingDescription(true);

      try {
        const existingDescription = form.getValues("description");
        const response = await fetch("/api/ai/generate-job-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            department,
            positionLevel: positionLevel || "Not specified",
            existingDescription: existingDescription || "",
          }),
        });

        const data = await readJsonObject(response);
        if (!response.ok) {
          throw new Error(getGenerateDescriptionErrorMessage(response, data));
        }

        const description = getJsonString(data, "description");
        if (description) {
          form.setValue("description", description);
          if (descriptionTimeoutRef.current) {
            clearTimeout(descriptionTimeoutRef.current);
          }
          descriptionTimeoutRef.current = setTimeout(() => {
            void form.trigger("description");
          }, 100);
          showSuccess("Job description generated successfully!");
        }
      } catch (error) {
        console.error("Error generating job description:", error);
        showError(
          error instanceof Error
            ? error.message
            : "Failed to generate job description.",
        );
      } finally {
        setIsGeneratingDescription(false);
      }
    },
    [form, showError, showSuccess],
  );

  const generateJobDescription = React.useCallback(async () => {
    const title = form.getValues("title");
    const department = form.getValues("department");
    const positionLevel = form.getValues("positionLevel");
    const currentDescription = form.getValues("description");
    const missingFields = getMissingDescriptionFields({
      department,
      positionLevel,
      title,
    });

    if (missingFields.length > 0) {
      showError(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    if (hasVisibleJobDescription(currentDescription)) {
      setShowReplaceConfirmation(true);
      return;
    }

    await performJobDescriptionGeneration(title, department, positionLevel || "");
  }, [form, performJobDescriptionGeneration, showError]);

  const confirmReplaceDescription = React.useCallback(async () => {
    const title = form.getValues("title");
    const department = form.getValues("department");
    const positionLevel = form.getValues("positionLevel");
    setShowReplaceConfirmation(false);
    await performJobDescriptionGeneration(title, department, positionLevel || "");
  }, [form, performJobDescriptionGeneration]);

  return {
    canGenerateDescription,
    confirmReplaceDescription,
    generateJobDescription,
    isGeneratingDescription,
    setShowReplaceConfirmation,
    showReplaceConfirmation,
  };
}
