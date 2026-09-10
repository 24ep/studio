"use client";

import type { DateRange } from 'react-day-picker';
import {
  type NewApplicationsPeriodType,
  type NewApplicationsPeriodUnit,
} from './new-applications-time-series-utils';
import {
  NewApplicationsCustomDateRangeControl,
  NewApplicationsPeriodAmountControls,
  NewApplicationsPeriodTypeSelect,
  NewApplicationsPeriodUnitSelect,
} from './NewApplicationsTimeSeriesControlParts';

interface NewApplicationsTimeSeriesControlsProps {
  periodType: NewApplicationsPeriodType;
  periodUnit: NewApplicationsPeriodUnit;
  periodN: number;
  dateRange: DateRange | undefined;
  onPeriodTypeChange: (value: NewApplicationsPeriodType) => void;
  onPeriodUnitChange: (value: NewApplicationsPeriodUnit) => void;
  onPeriodNChange: (value: number) => void;
  onDateRangeChange: (value: DateRange | undefined) => void;
}

export function NewApplicationsTimeSeriesControls({
  periodType,
  periodUnit,
  periodN,
  dateRange,
  onPeriodTypeChange,
  onPeriodUnitChange,
  onPeriodNChange,
  onDateRangeChange,
}: NewApplicationsTimeSeriesControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <NewApplicationsPeriodTypeSelect
        periodType={periodType}
        onPeriodTypeChange={onPeriodTypeChange}
      />

      {periodType === 'lastN' && (
        <NewApplicationsPeriodAmountControls
          periodN={periodN}
          periodUnit={periodUnit}
          max={365}
          unitWidth="w-20"
          onPeriodNChange={onPeriodNChange}
          onPeriodUnitChange={onPeriodUnitChange}
        />
      )}

      {periodType === 'pastN' && (
        <NewApplicationsPeriodAmountControls
          periodN={periodN}
          periodUnit={periodUnit}
          max={100}
          unitWidth="w-28"
          onPeriodNChange={onPeriodNChange}
          onPeriodUnitChange={onPeriodUnitChange}
        />
      )}

      {periodType !== 'custom' && periodType !== 'pastN' && periodType !== 'today' && periodType !== 'yesterday' && periodType !== 'lastN' && (
        <NewApplicationsPeriodUnitSelect
          className="w-28"
          periodUnit={periodUnit}
          onPeriodUnitChange={onPeriodUnitChange}
        />
      )}

      {periodType === 'custom' && (
        <NewApplicationsCustomDateRangeControl
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
        />
      )}
    </div>
  );
}
