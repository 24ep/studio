"use client";

import type React from 'react';
import { XMarkIcon as X } from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/badge';
import {
  removeApplicantSkill,
} from './applicant-filter-query-utils';
import {
  getApplicantSkillsInputKeyAction,
  getApplicantSkillsInputPasteAction,
  type ApplicantSkillsInputAction,
} from './applicant-skills-input-utils';

interface ApplicantSkillsInputProps {
  skills: Set<string>;
  onSkillsChange: (skills: Set<string>) => void;
  disabled?: boolean;
  inputId?: string;
  placeholder?: string;
  containerClassName?: string;
  inputClassName?: string;
  focusOnContainerClick?: boolean;
  scheduleApply?: () => void;
  onApply?: () => void;
  submitOnEnter?: boolean;
  allowTabToAdd?: boolean;
  allowBackspaceRemove?: boolean;
  allowPasteMerge?: boolean;
  removableButton?: boolean;
}

export function ApplicantSkillsInput({
  skills,
  onSkillsChange,
  disabled = false,
  inputId,
  placeholder = 'e.g., React, Python...',
  containerClassName = 'flex flex-wrap gap-1 min-h-[40px] border px-2 py-1 bg-background',
  inputClassName = 'flex-1 min-w-[120px] border-0 outline-none bg-transparent text-sm',
  focusOnContainerClick = false,
  scheduleApply,
  onApply,
  submitOnEnter = false,
  allowTabToAdd = false,
  allowBackspaceRemove = false,
  allowPasteMerge = false,
  removableButton = false,
}: ApplicantSkillsInputProps) {
  const applySkills = (nextSkills: Set<string>, shouldSchedule = true) => {
    onSkillsChange(nextSkills);
    if (shouldSchedule) {
      scheduleApply?.();
    }
  };

  const removeSkill = (skill: string) => {
    if (disabled) return;

    const result = removeApplicantSkill(skills, skill);
    if (result.changed) {
      applySkills(result.skills);
    }
  };

  const handleContainerClick = () => {
    if (!focusOnContainerClick || disabled || !inputId) return;
    document.getElementById(inputId)?.focus();
  };

  const runSkillInputAction = (action: ApplicantSkillsInputAction, target?: HTMLInputElement) => {
    if (action.type === 'none') return;
    if (action.type === 'submit') {
      onApply?.();
      return;
    }

    applySkills(action.skills);
    if (target) {
      target.value = '';
    }
    if (action.type === 'add' && action.shouldApply) {
      onApply?.();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    const target = event.target as HTMLInputElement;

    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
    }

    runSkillInputAction(getApplicantSkillsInputKeyAction({
      key: event.key,
      value: target.value,
      skills,
      options: {
        allowTabToAdd,
        allowBackspaceRemove,
        submitOnEnter,
      },
    }), target);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    const paste = event.clipboardData.getData('text');
    const action = getApplicantSkillsInputPasteAction({
      allowPasteMerge,
      paste,
      skills,
    });
    if (action.type === 'none') return;

    event.preventDefault();
    runSkillInputAction(action);
  };

  return (
    <div
      className={containerClassName}
      style={focusOnContainerClick ? { cursor: disabled ? 'not-allowed' : 'text' } : undefined}
      onClick={handleContainerClick}
      role={focusOnContainerClick ? 'button' : undefined}
      tabIndex={focusOnContainerClick ? 0 : undefined}
      onKeyDown={focusOnContainerClick ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.currentTarget.click();
        }
      } : undefined}
    >
      {Array.from(skills).map(skill => (
        <Badge key={skill} variant="secondary" className="flex items-center gap-1 px-2 py-0.5 text-xs">
          {skill}
          {removableButton ? (
            <span
              role="button"
              className="ml-1 text-muted-foreground hover:text-destructive focus:outline-none cursor-pointer"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                removeSkill(skill);
              }}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              aria-label={`Remove ${skill}`}
              tabIndex={-1}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.currentTarget.click();
                }
              }}
            >
              <X className="w-3 h-3" />
            </span>
          ) : (
            <X
              className="w-3 h-3 cursor-pointer"
              onClick={() => removeSkill(skill)}
            />
          )}
        </Badge>
      ))}
      <input
        id={inputId}
        type="text"
        className={inputClassName}
        placeholder={placeholder}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
    </div>
  );
}
