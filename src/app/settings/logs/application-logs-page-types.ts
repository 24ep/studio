import type { LogEntry, LogLevel, UserProfile } from '@/lib/types';

export const APPLICATION_LOGS_PAGE_SIZE = 20;

export interface ApplicationLogsFilters {
  level: LogLevel | 'ALL';
  search: string;
  userId: string;
  start?: Date;
  end?: Date;
}

export type LogUserOption = Pick<UserProfile, 'id' | 'name' | 'avatarUrl' | 'personalColor'>;

export interface ApplicationLogsPageState {
  logs: LogEntry[];
  isLoading: boolean;
  fetchError: string | null;
  isClient: boolean;
  currentPage: number;
  totalLogs: number;
  totalPages: number;
  levelFilter: LogLevel | 'ALL';
  searchQuery: string;
  actingUserIdFilter: string;
  startDate?: Date;
  endDate?: Date;
  allUsers: LogUserOption[];
  userSearch: string;
  userPopoverOpen: boolean;
  isModalOpen: boolean;
  editingLog: LogEntry | null;
}
