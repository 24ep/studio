"use client";

import type { ReactNode } from "react";
import { ArrowPathIcon as Loader2 } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MobileApplicantFooterNoteFieldProps {
  id: string;
  label: string;
  note: string;
  onNoteChange: (note: string) => void;
  placeholder: string;
  toneClassName: string;
}

export function MobileApplicantFooterNoteField({
  id,
  label,
  note,
  onNoteChange,
  placeholder,
  toneClassName,
}: MobileApplicantFooterNoteFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <Textarea
        id={id}
        placeholder={placeholder}
        value={note}
        onChange={(event) => onNoteChange(event.target.value)}
        className={`min-h-[100px] text-sm resize-none focus:ring-1 ${toneClassName}`}
      />
    </div>
  );
}

interface MobileApplicantFooterPopoverActionsProps {
  cancelClassName: string;
  confirmClassName: string;
  confirmLabel: string;
  confirmSpinnerClassName: string;
  isStatusUpdating: boolean;
  justifyClassName: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  variant?: "default" | "destructive";
}

export function MobileApplicantFooterPopoverActions({
  cancelClassName,
  confirmClassName,
  confirmLabel,
  confirmSpinnerClassName,
  isStatusUpdating,
  justifyClassName,
  onCancel,
  onConfirm,
  variant = "default",
}: MobileApplicantFooterPopoverActionsProps) {
  return (
    <div className={`flex gap-2 pt-2 ${justifyClassName}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        disabled={isStatusUpdating}
        className={cancelClassName}
      >
        Cancel
      </Button>
      <Button
        size="sm"
        variant={variant}
        disabled={isStatusUpdating}
        onClick={onConfirm}
        className={confirmClassName}
      >
        {isStatusUpdating ? (
          <Loader2 className={`${confirmSpinnerClassName} animate-spin`} />
        ) : (
          confirmLabel
        )}
      </Button>
    </div>
  );
}

interface MobileApplicantFooterPopoverLayoutProps {
  actions: ReactNode;
  description: ReactNode;
  icon?: ReactNode;
  noteField: ReactNode;
  title: string;
  titleClassName: string;
}

export function MobileApplicantFooterPopoverLayout({
  actions,
  description,
  icon,
  noteField,
  title,
  titleClassName,
}: MobileApplicantFooterPopoverLayoutProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className={`font-semibold leading-none flex items-center gap-2 ${titleClassName}`}>
          {icon}
          {title}
        </h4>
        {description}
      </div>
      {noteField}
      {actions}
    </div>
  );
}
