"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText as FileTextIcon } from 'lucide-react';
import type { EvaluationRecord } from '../types';

interface RemarksSectionProps {
  allEvaluations: EvaluationRecord[];
}

export function RemarksSection({ allEvaluations }: RemarksSectionProps) {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
        <FileTextIcon className="h-5 w-5 text-indigo-600" />
        Remarks & Notes
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from(new Map(allEvaluations.map(e => [e.evaluator?.id, e])).values())
          .filter(e => e.evaluator)
          .map((evaluation) => {
            const evaluator = evaluation.evaluator;
            return (
              <Card key={evaluator?.id || evaluation.id} className="border rounded-lg bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={evaluator?.avatarUrl || evaluator?.image || undefined} alt={evaluator?.name || ''} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        {evaluator?.name?.charAt(0)?.toUpperCase() || 'E'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{evaluator?.name || 'Unknown Evaluator'}</p>
                      {evaluator?.positionTitle && (
                        <p className="text-xs text-muted-foreground">{evaluator.positionTitle}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
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

