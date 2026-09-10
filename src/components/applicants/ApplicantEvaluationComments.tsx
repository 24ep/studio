"use client";

import { ChatBubbleLeftRightIcon as MessageSquare } from "@heroicons/react/24/outline";

import { sanitizeHtml } from "@/lib/utils";
import type { EvaluationData } from "./applicant-evaluation-section-utils";

export function EvaluationComments({
  evaluations,
}: {
  evaluations: EvaluationData[];
}) {
  const evaluationsWithComments = evaluations.filter((evaluation) => evaluation.comments?.trim());
  if (evaluationsWithComments.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase flex items-center gap-2">
        <MessageSquare className="w-3 h-3" />
        Interview Comments
      </h4>
      <div className="space-y-2">
        {evaluationsWithComments.map((evaluation) => (
          <div key={evaluation.id} className="border rounded-md p-3 bg-muted/20">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {evaluation.evaluator && (
                  <div className="text-xs font-medium text-foreground mb-1">
                    {evaluation.evaluator.name || evaluation.evaluator.email}
                  </div>
                )}
                <div
                  className="text-xs text-muted-foreground prose prose-sm dark:prose-invert max-w-none [&_p]:my-1"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(evaluation.comments || "") }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
