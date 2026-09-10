"use client";

import React from 'react';
import { DocumentTextIcon as FileText, CpuChipIcon as BrainCircuit, ChevronRightIcon as ChevronRight, ChevronDownIcon as ChevronDown } from '@heroicons/react/24/outline';
import type { GroupedSkill } from '../types';
import { DetailedAnalysisSkillGroupCard } from './DetailedAnalysisSkillGroupCard';

interface DetailedAnalysisProps {
  expertiseGroups: GroupedSkill[];
  expandedGroups: Set<string>;
  toggleGroup: (groupId: string) => void;
}

export function DetailedAnalysis({
  expertiseGroups,
  expandedGroups,
  toggleGroup,
}: DetailedAnalysisProps) {
  return (
    <div className="space-y-8">
      <button type="button"
        onClick={() => {
          toggleGroup('detailed-analysis');
        }}
        className="w-full flex items-center gap-3 pb-3 border-b-2 border-gray-200 hover:opacity-80 transition-opacity no-print"
      >
        <div className="p-2 bg-indigo-100 rounded-lg">
          <FileText className="h-6 w-6 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Detailed Analysis</h2>
        {expandedGroups.has('detailed-analysis') ? (
          <ChevronDown className="h-5 w-5 text-gray-500 ml-auto" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-500 ml-auto" />
        )}
      </button>

      {expandedGroups.has('detailed-analysis') && (
        <div className="space-y-8">
          {/* Testing Result Section */}
          {expertiseGroups.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
                <BrainCircuit className="h-5 w-5 text-blue-600" />
                Testing Results
              </h3>

              <div className="space-y-3">
                {expertiseGroups.map(group => {
                  const isExpanded = expandedGroups.has(group.groupId);

                  return (
                    <DetailedAnalysisSkillGroupCard
                      key={group.groupId}
                      group={group}
                      isExpanded={isExpanded}
                      toggleGroup={toggleGroup}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

