"use client";

import { RealTimeStatus } from './RealTimeStatus';

export function DashboardHeader({
  onDataUpdate,
}: {
  onDataUpdate: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="h-6 sm:h-8 w-1 bg-gradient-to-b from-blue-500 to-blue-400 rounded-full" />
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Real-time recruitment metrics</p>
        </div>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
        <RealTimeStatus onDataUpdate={onDataUpdate} />
      </div>
    </div>
  );
}
