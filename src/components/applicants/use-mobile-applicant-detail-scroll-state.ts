import { useEffect, useRef, useState } from "react";

import type { MobileApplicantDetailTab } from "./MobileApplicantTabsNav";

export function useMobileApplicantDetailScrollState(activeTab: MobileApplicantDetailTab) {
  const [isScrolled, setIsScrolled] = useState(false);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!mainContainerRef.current) return;

      const scrollableElements = mainContainerRef.current.querySelectorAll('[class*="overflow-y-auto"]');
      let maxScrollTop = 0;

      scrollableElements.forEach((element) => {
        if (element instanceof HTMLElement && element.scrollTop > maxScrollTop) {
          maxScrollTop = element.scrollTop;
        }
      });

      setIsScrolled(maxScrollTop > 10);
    };

    const attachScrollListeners = () => {
      const scrollableElements = mainContainerRef.current?.querySelectorAll('[class*="overflow-y-auto"]');
      scrollableElements?.forEach((element) => {
        element.addEventListener("scroll", handleScroll, { passive: true });
      });
    };

    const observer = new MutationObserver(attachScrollListeners);

    if (mainContainerRef.current) {
      observer.observe(mainContainerRef.current, {
        childList: true,
        subtree: true,
      });
      attachScrollListeners();
    }

    return () => {
      observer.disconnect();
      const scrollableElements = mainContainerRef.current?.querySelectorAll('[class*="overflow-y-auto"]');
      scrollableElements?.forEach((element) => {
        element.removeEventListener("scroll", handleScroll);
      });
    };
  }, [activeTab]);

  return { isScrolled, mainContainerRef };
}
