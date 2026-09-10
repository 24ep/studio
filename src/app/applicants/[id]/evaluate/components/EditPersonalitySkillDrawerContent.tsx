"use client";

import { CheckCircle } from 'lucide-react';

import { Textarea } from '@/components/ui/textarea';
import type { EvaluationQuestion } from '../types';

const SCORE_OPTIONS = [
  { value: 1, label: 'Unsatisfactory', color: 'bg-[#E84040]' },
  { value: 2, label: 'Needs Improvement', color: 'bg-[#F4A340]' },
  { value: 3, label: 'Meets Expectations', color: 'bg-[#F1D24A]' },
  { value: 4, label: 'Exceeds Expectations', color: 'bg-[#63E25F]' },
  { value: 5, label: 'Exceptional', color: 'bg-[#2E7D32]' },
];

interface EditPersonalitySkillDrawerContentProps {
  notesId: string;
  question: EvaluationQuestion;
  onClose: () => void;
  onScoreChange: (questionId: string, score: number) => void;
  onNotesChange: (questionId: string, notes: string) => void;
}

export function EditPersonalitySkillDrawerContent({
  notesId,
  question,
  onClose,
  onScoreChange,
  onNotesChange,
}: EditPersonalitySkillDrawerContentProps) {
  return (
    <div className="space-y-6">
      {question.shortDescription && (
        <p className="text-sm text-muted-foreground">
          {question.shortDescription}
        </p>
      )}
      {question.description && (
        <p className="text-base text-muted-foreground">
          {question.description}
        </p>
      )}

      <div className="flex flex-col gap-4">
        {SCORE_OPTIONS.map((option) => (
          <ScoreOptionButton
            key={option.value}
            option={option}
            isSelected={question.score === option.value}
            onSelect={() => {
              onScoreChange(question.id, option.value);
              onClose();
            }}
          />
        ))}
      </div>

      <div className="space-y-2">
        <label htmlFor={notesId} className="text-sm font-semibold">
          Notes
        </label>
        <Textarea
          id={notesId}
          value={question.notes}
          onChange={(event) => onNotesChange(question.id, event.target.value)}
          placeholder="Add notes about this trait..."
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
}

function ScoreOptionButton({
  option,
  isSelected,
  onSelect,
}: {
  option: (typeof SCORE_OPTIONS)[number];
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-primary bg-primary/10'
          : 'border-border hover:border-primary/50'
      }`}
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ${option.color} ${isSelected ? 'opacity-100 scale-110' : 'opacity-50'}`}>
        {option.value}
      </div>
      <div className="flex-1 text-left">
        <div className="font-semibold text-base">{option.label}</div>
      </div>
      {isSelected && (
        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
      )}
    </button>
  );
}
