import { useEffect, useRef, type MutableRefObject } from 'react';

export interface ApplicantFilterTimeoutRefs {
  multiselectTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  autoApplyTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  skillsTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  initializationTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  syncingTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  applyingFiltersTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  positionChangeTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  urlFiltersTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
}

function clearTimeoutRef(ref: MutableRefObject<NodeJS.Timeout | null>) {
  if (ref.current) {
    clearTimeout(ref.current);
    ref.current = null;
  }
}

export function useApplicantFilterTimeoutRefs(): ApplicantFilterTimeoutRefs {
  const multiselectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoApplyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const skillsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const applyingFiltersTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const positionChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const urlFiltersTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => () => {
    [
      multiselectTimeoutRef,
      autoApplyTimeoutRef,
      skillsTimeoutRef,
      initializationTimeoutRef,
      syncingTimeoutRef,
      applyingFiltersTimeoutRef,
      positionChangeTimeoutRef,
      urlFiltersTimeoutRef,
    ].forEach(clearTimeoutRef);
  }, []);

  return {
    multiselectTimeoutRef,
    autoApplyTimeoutRef,
    skillsTimeoutRef,
    initializationTimeoutRef,
    syncingTimeoutRef,
    applyingFiltersTimeoutRef,
    positionChangeTimeoutRef,
    urlFiltersTimeoutRef,
  };
}
