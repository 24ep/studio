"use client";

import { useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { usePositionLevels } from "@/hooks/use-position-levels";
import { createApplicantFromForm } from "./add-applicant-modal-api";
import {
  addApplicantFormSchema,
  createAddApplicantDefaultValues,
  createOpenAddApplicantDefaultValues,
  type AddApplicantFormValues,
} from "./add-applicant-modal-form";
import type { AddApplicantModalProps } from "./AddApplicantModalTypes";

export function useAddApplicantModal({
  availableStages,
  availableSources,
  isOpen,
  onApplicantCreated,
  onOpenChange,
}: AddApplicantModalProps) {
  const { levels: positionLevels } = usePositionLevels();
  const form = useForm<AddApplicantFormValues>({
    resolver: zodResolver(addApplicantFormSchema),
    defaultValues: createAddApplicantDefaultValues(availableStages),
  });

  const education = useFieldArray({
    control: form.control,
    name: "education",
  });
  const experience = useFieldArray({
    control: form.control,
    name: "experience",
  });
  const skills = useFieldArray({
    control: form.control,
    name: "skills",
  });

  const prevIsOpen = useRef(isOpen);
  useEffect(() => {
    if (!prevIsOpen.current && isOpen) {
      form.reset(createOpenAddApplicantDefaultValues(availableStages));
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, form, availableStages]);

  const onSubmit = async (data: AddApplicantFormValues) => {
    try {
      await createApplicantFromForm(data);
      toast.success("Applicant created successfully");
      await onApplicantCreated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding applicant:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create applicant");
    }
  };

  return {
    availableStages,
    availableSources,
    education,
    experience,
    form,
    onSubmit,
    positionLevels,
    skills,
  };
}

export type AddApplicantModalController = ReturnType<typeof useAddApplicantModal>;
