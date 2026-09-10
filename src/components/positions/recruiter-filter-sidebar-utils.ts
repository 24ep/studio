import type { RecruiterFilterRecruiter, RecruiterStats } from './recruiter-filter-sidebar-types';

const RECRUITER_FALLBACK_COLORS = [
  'bg-primary/20 text-primary',
  'bg-purple-500/20 text-purple-600',
  'bg-green-500/20 text-green-600',
  'bg-pink-500/20 text-pink-600',
  'bg-indigo-500/20 text-indigo-600',
  'bg-teal-500/20 text-teal-600'
];

export function getRecruiterIds(recruiters: RecruiterFilterRecruiter[]): string[] {
  return recruiters.map((recruiter) => recruiter.id);
}

export function filterRecruiterIds(
  recruiters: RecruiterFilterRecruiter[],
  searchTerm: string
): string[] {
  const trimmedSearch = searchTerm.trim();

  if (!trimmedSearch) {
    return getRecruiterIds(recruiters);
  }

  const searchLower = trimmedSearch.toLowerCase();
  return recruiters
    .filter((recruiter) => recruiter.name.toLowerCase().includes(searchLower))
    .map((recruiter) => recruiter.id);
}

export function shouldShowAllRecruitersOption(searchTerm: string): boolean {
  const searchLower = searchTerm.trim().toLowerCase();
  return !searchLower || 'all recruiters'.includes(searchLower);
}

export function shouldShowUnassignedOption(recruiterStats?: RecruiterStats): boolean {
  return recruiterStats?.unassigned !== undefined;
}

export function shouldShowNoSearchMatches(
  searchTerm: string,
  filteredRecruiterIds: string[],
  showUnassigned: boolean
): boolean {
  return Boolean(searchTerm.trim()) && filteredRecruiterIds.length === 0 && !showUnassigned;
}

export function shouldShowNoRecruitersAvailable(
  searchTerm: string,
  recruiterIds: string[],
  recruiterStats?: RecruiterStats
): boolean {
  return !searchTerm.trim() && recruiterIds.length === 0 && recruiterStats?.unassigned === undefined;
}

export function getRecruiterFallbackColor(recruiterId: string, index: number): string {
  const parsedId = parseInt(recruiterId, 10);
  const colorIndex = Number.isNaN(parsedId) ? index % RECRUITER_FALLBACK_COLORS.length : parsedId % RECRUITER_FALLBACK_COLORS.length;
  return RECRUITER_FALLBACK_COLORS[colorIndex];
}

export function getRecruiterDisplayName(recruiterId: string, recruiter?: RecruiterFilterRecruiter): string {
  return recruiter?.name || `Recruiter ${recruiterId}`;
}

export function isRecruiterKeyboardActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' ';
}
