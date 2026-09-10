"use client";

import { useEffect, useRef } from "react";

export function useReprocessModalIsolation(isOpen: boolean) {
  const modalIsolationRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    modalIsolationRef.current = true;

    const preventRefresh = (event: Event) => {
      if (modalIsolationRef.current) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    document.addEventListener("visibilitychange", preventRefresh);
    document.addEventListener("beforeunload", preventRefresh);

    const originalConsoleLog = console.log;
    console.log = (...args) => {
      if (args[0] && typeof args[0] === "string" &&
        (args[0].includes("SSE refresh") || args[0].includes("periodic refresh"))) {
        return;
      }
      originalConsoleLog(...args);
    };

    return () => {
      modalIsolationRef.current = false;
      document.removeEventListener("visibilitychange", preventRefresh);
      document.removeEventListener("beforeunload", preventRefresh);
      console.log = originalConsoleLog;
    };
  }, [isOpen]);

  return {
    markModalIsolated: () => {
      modalIsolationRef.current = true;
    },
  };
}
