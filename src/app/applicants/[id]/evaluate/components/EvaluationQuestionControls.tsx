"use client";

import React from 'react';
import type { EvaluationQuestion } from '../types';

interface EvaluationQuestionControlsProps {
    currentQuestion: EvaluationQuestion | null;
    onScoreChange: (questionId: string, score: number) => void;
}

export function EvaluationQuestionControls({
    currentQuestion,
    onScoreChange,
}: EvaluationQuestionControlsProps) {
    if (!currentQuestion) return null;

    return (
        <div className="flex flex-col gap-3 w-full">
            {[
                { value: 1, label: 'Unsatisfactory', color: 'bg-[#E84040]' },
                { value: 2, label: 'Needs Improvement', color: 'bg-[#F4A340]' },
                { value: 3, label: 'Meets Expectations', color: 'bg-[#F1D24A]' },
                { value: 4, label: 'Exceeds Expectations', color: 'bg-[#63E25F]' },
                { value: 5, label: 'Exceptional', color: 'bg-[#2E7D32]' },
            ].map((opt) => {
                const isSelected = currentQuestion.score === opt.value;
                return (
                    <button type="button"
                        key={opt.value}
                        onClick={() => onScoreChange(currentQuestion.id, opt.value)}
                        className={`relative w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'}`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${opt.color} ${isSelected ? 'opacity-100' : 'opacity-70'}`}>
                            {opt.value}
                        </div>
                        <div className="text-left font-medium text-sm">
                            {opt.label}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
