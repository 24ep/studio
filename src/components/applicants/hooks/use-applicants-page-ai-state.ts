import { useCallback, useState } from 'react';

export function useApplicantsPageAiState() {
  const [aiSearchReasoning, setAiSearchReasoning] = useState<string | null>(null);
  const [aiMatchedApplicantIds, setAiMatchedApplicantIds] = useState<string[] | null>(null);
  const [aiRecordCount, setAiRecordCount] = useState<number>(0);
  const [isAiSearchActive, setIsAiSearchActive] = useState(false);
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);

  const stableSetAiMatchedApplicantIds = useCallback((ids: string[] | null) => {
    setAiMatchedApplicantIds(ids);
  }, []);

  const stableSetAiSearchReasoning = useCallback((reasoning: string | null) => {
    setAiSearchReasoning(reasoning);
  }, []);

  const stableSetAiRecordCount = useCallback((count: number) => {
    setAiRecordCount(count);
  }, []);

  const stableSetIsAiSearchActive = useCallback((active: boolean) => {
    setIsAiSearchActive(active);
  }, []);

  const handleOpenSearchDrawer = useCallback(() => setIsSearchDrawerOpen(true), []);

  return {
    aiSearchReasoning,
    setAiSearchReasoning,
    aiMatchedApplicantIds,
    setAiMatchedApplicantIds,
    aiRecordCount,
    setAiRecordCount,
    isAiSearchActive,
    setIsAiSearchActive,
    isSearchDrawerOpen,
    setIsSearchDrawerOpen,
    stableSetAiMatchedApplicantIds,
    stableSetAiSearchReasoning,
    stableSetAiRecordCount,
    stableSetIsAiSearchActive,
    handleOpenSearchDrawer,
  };
}
