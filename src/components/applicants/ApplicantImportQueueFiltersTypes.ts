import type { DateRange } from 'react-day-picker';
import type {
  UploadQueueDateFilterType,
  UploadQueueDatePreset,
} from './applicant-import-queue-util-types';

export interface ApplicantImportQueueFiltersProps {
  availableSources: Array<{ id: string; name: string; logo?: string }>;
  dateFilterType: UploadQueueDateFilterType;
  dateRange?: DateRange;
  openSelect: string | null;
  positionFilter: string;
  positionSearchTerm: string;
  positions: Array<{ id: string; title: string }>;
  searchTerm: string;
  sourceFilter: string;
  sourceSearchTerm: string;
  statusFilter: string;
  clearAllFilters: () => void;
  clearDateRange: () => void;
  handleDateFilterTypeChange: (type: UploadQueueDateFilterType) => void;
  handleDateRangeChange: (range: DateRange | undefined) => void;
  handlePositionFilterChange: (value: string) => void;
  handleSearch: () => void;
  handleSourceFilterChange: (value: string) => void;
  handleStatusFilterChange: (value: string) => void;
  setDatePreset: (preset: UploadQueueDatePreset) => void;
  setOpenSelect: (value: string | null) => void;
  setPositionSearchTerm: (value: string) => void;
  setSearchTerm: (value: string) => void;
  setSourceSearchTerm: (value: string) => void;
}
