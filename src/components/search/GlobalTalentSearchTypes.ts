import type { GlobalTalentSearchResult } from "@/services/globalTalentSearchService";

export interface GlobalTalentSearchProps {
  buttonLabel?: string;
  buttonClassName?: string;
  compact?: boolean;
  onApplicantSelect?: (result: GlobalTalentSearchResult) => void;
  onPositionSelect?: (result: GlobalTalentSearchResult) => void;
}

export interface GlobalTalentSearchResults {
  applicants: GlobalTalentSearchResult[];
  positions: GlobalTalentSearchResult[];
}

export interface GlobalTalentSearchButtonProps {
  buttonLabel: string;
  buttonClassName?: string;
  compact: boolean;
  onOpen: () => void;
}

export interface GlobalTalentSearchResultsProps {
  results: GlobalTalentSearchResults;
  onApplicantSelect: (result: GlobalTalentSearchResult) => void;
  onPositionSelect: (result: GlobalTalentSearchResult) => void;
}
