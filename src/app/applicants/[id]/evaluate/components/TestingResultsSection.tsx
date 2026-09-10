"use client";

import React, { useRef } from 'react';
import { BarChart3 } from 'lucide-react';
import type { TestingResult } from '../types';

interface TestingResultsSectionProps {
  testingResults: TestingResult[];
  canEditScores: boolean;
  onScoreChange: (index: number, score: number) => void;
  onBlur: () => void;
  testingResultsRef: React.MutableRefObject<TestingResult[]>;
}

export function TestingResultsSection({
  testingResults,
  canEditScores,
  onScoreChange,
  onBlur,
  testingResultsRef,
}: TestingResultsSectionProps) {
  if (testingResults.length === 0) return null;

  return (
    <>
      <div className="mt-6 space-y-6">
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Testing Result
        </h3>

        {(() => {
          // Group by groupName
          const groups = new Map<string, Array<{ item: typeof testingResults[0], index: number }>>();
          testingResults.forEach((item, index) => {
            const name = item.groupName || 'General';
            if (!groups.has(name)) {
              groups.set(name, []);
            }
            groups.get(name)!.push({ item, index });
          });

          return Array.from(groups.entries()).map(([groupName, items]) => (
            <div key={groupName} className="border-0 md:border rounded-xl p-0 md:p-4 bg-transparent md:bg-muted/20">
              {items.length > 0 && groupName !== 'General' && (
                <div className="text-sm font-semibold uppercase text-muted-foreground mb-4">{groupName}</div>
              )}
              <div className="flex flex-wrap gap-2 justify-start">
                {items.map(({ item, index }) => (
                  <div key={item.id || item.label} className="flex flex-col items-center gap-2 transition-all duration-500 ease-in-out hover:scale-110 rounded-md">
                    <div className="text-center mb-2 max-w-[140px] sm:max-w-[160px]">
                      <div className="text-base font-medium text-gray-500 break-words">{item.label}</div>
                    </div>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-[4.5rem] md:h-[4.5rem] rounded-full bg-secondary flex flex-col items-center justify-center relative transition-all duration-500 ease-in-out hover:scale-[1.1] hover:shadow-lg">
                      {canEditScores ? (
                        <input
                          type="number"
                          min={0}
                          max={item.maxScore}
                          value={item.score || 0}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(item.maxScore, parseInt(e.target.value || '0', 10)));
                            onScoreChange(index, val);
                          }}
                          onBlur={onBlur}
                          className="w-full h-full text-center text-base sm:text-xl md:text-2xl font-bold bg-transparent outline-none text-gray-800 touch-manipulation cursor-pointer"
                          style={{
                            WebkitAppearance: 'none',
                            MozAppearance: 'textfield',
                            touchAction: 'manipulation'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full text-center text-base sm:text-xl md:text-2xl font-bold text-gray-800 flex items-center justify-center">
                          {item.score || 0}
                        </div>
                      )}
                      <div className="text-sm text-gray-600 mt-0.5 absolute bottom-1">/{item.maxScore}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ));
        })()}
      </div>
    </>
  );
}

