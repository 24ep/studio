"use client";

import * as React from "react";

const OPEN_DELAY_MS = 90;
const CLOSE_DELAY_MS = 160;

export function useHeaderCategoryMenu(resetKey: string) {
  const [openCategory, setOpenCategory] = React.useState<string | null>(null);
  const openTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearOpenTimer = React.useCallback(() => {
    if (!openTimerRef.current) return;
    clearTimeout(openTimerRef.current);
    openTimerRef.current = null;
  }, []);

  const clearCloseTimer = React.useCallback(() => {
    if (!closeTimerRef.current) return;
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);

  const clearTimers = React.useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
  }, [clearCloseTimer, clearOpenTimer]);

  const scheduleOpen = React.useCallback((label: string) => {
    clearTimers();
    openTimerRef.current = setTimeout(() => setOpenCategory(label), OPEN_DELAY_MS);
  }, [clearTimers]);

  const scheduleClose = React.useCallback((label: string) => {
    clearTimers();
    closeTimerRef.current = setTimeout(() => {
      setOpenCategory(current => current === label ? null : current);
    }, CLOSE_DELAY_MS);
  }, [clearTimers]);

  const setCategoryOpen = React.useCallback((label: string, open: boolean) => {
    clearTimers();
    setOpenCategory(current => {
      if (open) return label;
      return current === label ? null : current;
    });
  }, [clearTimers]);

  const closeCategory = React.useCallback(() => {
    clearTimers();
    setOpenCategory(null);
  }, [clearTimers]);

  React.useEffect(() => clearTimers, [clearTimers]);

  React.useEffect(() => {
    closeCategory();
  }, [closeCategory, resetKey]);

  return {
    clearCloseTimer,
    closeCategory,
    openCategory,
    scheduleClose,
    scheduleOpen,
    setCategoryOpen,
  };
}
