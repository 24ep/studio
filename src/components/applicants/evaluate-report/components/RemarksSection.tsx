"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DocumentTextIcon as FileTextIcon } from '@heroicons/react/24/outline';
import type { EvaluationRecord } from '../types';

interface RemarksSectionProps {
  allEvaluations: EvaluationRecord[];
}

export function RemarksSection({ allEvaluations }: RemarksSectionProps) {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
        <FileTextIcon className="h-5 w-5 text-primary" />
        Remarks & Notes
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
        {Array.from(new Map(allEvaluations.map(e => [e.evaluator?.id, e])).values())
          .filter(e => e.evaluator)
          .map((evaluation) => {
            const evaluator = evaluation.evaluator;
            return (
              <Card key={evaluator?.id || evaluation.id} className="shadow-sm border border-gray-200 bg-white h-full max-w-full relative">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-start gap-3 mb-3 shrink-0">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={evaluator?.avatarUrl || evaluator?.image || undefined} alt={evaluator?.name || ''} />
                      <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                        {evaluator?.name?.charAt(0)?.toUpperCase() || 'E'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{evaluator?.name || 'Unknown Evaluator'}</p>
                      {evaluation.position?.title && (
                        <p className="text-xs text-gray-500">{evaluation.position.title}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex-grow">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed break-words">
                      {evaluation.comments || 'No remark provided'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}

