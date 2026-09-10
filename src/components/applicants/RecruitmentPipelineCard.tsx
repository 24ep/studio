"use client";

import type { RecruitmentStage, TransitionRecord } from "@/lib/types";
import {
  RecruitmentPipelineEmptyState,
  RecruitmentPipelineLine,
  RecruitmentPipelineStageNode,
  RecruitmentPipelineStyles,
} from "./RecruitmentPipelineCardParts";
import { useRecruitmentPipelineCard } from "./use-recruitment-pipeline-card";

interface RecruitmentPipelineCardProps {
  stages: RecruitmentStage[];
  transitionHistory: TransitionRecord[];
  currentStatus: string;
  onStageClick: (stageName: string) => void;
  editableNotes: boolean;
  onNoteEdit: (transitionId: string, newNote: string) => Promise<void>;
  applicantId: string;
}

export function RecruitmentPipelineCard({
  stages,
  transitionHistory,
  currentStatus,
  onStageClick,
}: RecruitmentPipelineCardProps) {
  const pipeline = useRecruitmentPipelineCard({
    currentStatus,
    onStageClick,
    stages,
    transitionHistory,
  });

  return (
    <>
      <RecruitmentPipelineStyles />
      <div className="w-full">
        <div className="relative">
          {pipeline.stageViews.length === 0 ? (
            <RecruitmentPipelineEmptyState />
          ) : (
            <div
              className="overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div
                className="flex items-center relative"
                style={{
                  width: pipeline.stageViews.length <= 5 ? `${pipeline.stageViews.length * 120}px` : "100%",
                  maxWidth: "100%",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                }}
              >
                {pipeline.stageViews.map((view) => (
                  <RecruitmentPipelineStageNode
                    key={view.stage.id}
                    isOpen={pipeline.openPopoverIdx === view.index}
                    isTransitioning={pipeline.isTransitioning}
                    onClose={() => pipeline.setOpenPopoverIdx(null)}
                    onOpen={() => pipeline.setOpenPopoverIdx(view.index)}
                    onStageClick={pipeline.handleStageClick}
                    view={view}
                  />
                ))}

                <RecruitmentPipelineLine gradient={pipeline.lineGradient} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
