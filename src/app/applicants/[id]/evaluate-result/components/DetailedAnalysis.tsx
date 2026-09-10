"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { FileText, BrainCircuit, ChevronRight, ChevronDown } from 'lucide-react';
import { getScoreColorInfo } from '@/components/ui/score-color';
import type { GroupedSkill } from '../types';

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
        className="w-full flex items-center gap-3 pb-3 border-b-2 border-border hover:opacity-80 transition-opacity no-print"
      >
        <div className="p-2 bg-indigo-100 rounded-lg">
          <FileText className="h-6 w-6 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Detailed Analysis</h2>
        {expandedGroups.has('detailed-analysis') ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground ml-auto" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
        )}
      </button>

      {expandedGroups.has('detailed-analysis') && (
        <div className="space-y-8">
          {/* Testing Result Section */}
          {expertiseGroups.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                <BrainCircuit className="h-5 w-5 text-blue-600" />
                Testing Results
              </h3>

              <div className="space-y-3">
                {expertiseGroups.map(group => {
                  const isExpanded = expandedGroups.has(group.groupId);
                  const avgScore = group.skills.reduce((sum, s) => sum + s.percentage, 0) / group.skills.length;
                  const colorInfo = getScoreColorInfo(avgScore);

                  return (
                    <Card key={group.groupId} className="shadow-sm border border-border">
                      {/* Group Header */}
                      <button type="button"
                        onClick={() => toggleGroup(group.groupId)}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors no-print rounded-t-lg"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          )}
                          <div 
                            className="w-1 h-8 rounded-full flex-shrink-0"
                            style={{ backgroundColor: group.groupColor }}
                          />
                          <span 
                            className="text-sm font-semibold text-foreground truncate"
                          >
                            {group.groupName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Average</p>
                            <p className={`text-sm font-bold ${colorInfo.text}`}>
                              {avgScore.toFixed(1)}%
                            </p>
                          </div>
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${colorInfo.bg.replace('bg-', 'bg-').replace('text-', '')}`}
                              style={{ 
                                width: `${avgScore}%`,
                                backgroundColor: group.groupColor 
                              }}
                            />
                          </div>
                        </div>
                      </button>

                      {/* Group Skills */}
                      {isExpanded && (
                        <div className="border-t border-border bg-muted/30 print:block">
                          <div className="p-2 space-y-1">
                            {group.skills.map(skill => {
                              const percentage = (skill.score / skill.maxScore) * 100;
                              const skillColorInfo = getScoreColorInfo(percentage);
                              return (
                                <div
                                  key={skill.id}
                                  className="flex items-center justify-between p-3 bg-card rounded-lg hover:bg-muted/50 transition-colors border border-border"
                                >
                                  <span className="text-sm text-foreground flex-1 min-w-0 font-medium">
                                    {skill.name}
                                  </span>
                                  <div className="flex items-center gap-4 flex-shrink-0">
                                    <span className="text-sm text-muted-foreground font-medium">{skill.score}/{skill.maxScore}</span>
                                    <div className="w-20 bg-muted rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full transition-all ${skillColorInfo.bg}`}
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${skillColorInfo.bg} ${skillColorInfo.text} min-w-[60px] text-center`}>
                                      {percentage.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </Card>
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

