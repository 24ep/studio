"use client";

import React from "react";
import { CheckIcon as Check, ChevronRightIcon as ChevronRight } from "@heroicons/react/24/outline";

import { cn } from "@/lib/utils";
import {
  getCreateEvaluateLinkSteps,
  getStepIndex,
  type CreateEvaluateLinkStep,
} from "./create-evaluate-link-utils";

interface CreateEvaluateLinkStepIndicatorProps {
  currentStep: CreateEvaluateLinkStep;
  invitationEnabled: boolean;
  sendEmail: boolean;
}

export function CreateEvaluateLinkStepIndicator({
  currentStep,
  invitationEnabled,
  sendEmail,
}: CreateEvaluateLinkStepIndicatorProps) {
  const steps = getCreateEvaluateLinkSteps(invitationEnabled, sendEmail);
  const currentStepIndex = getStepIndex(steps, currentStep);

  return (
    <div className="flex items-center gap-2 mb-4">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div
            className={cn(
              "flex items-center gap-2",
              currentStep === step.id ? "text-primary" : "text-muted-foreground"
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium",
                currentStep === step.id
                  ? "bg-primary text-primary-foreground"
                  : currentStepIndex > index
                    ? "bg-primary/20 text-primary"
                    : "bg-muted"
              )}
            >
              {currentStepIndex > index ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
          </div>
          {index < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </React.Fragment>
      ))}
    </div>
  );
}
