"use client";

import * as React from "react";

const createValue = "__create_new_type__";

function syncSelect(select: HTMLSelectElement, runTypes: string[]) {
  const createOption = Array.from(select.options).find(option =>
    option.value === createValue || option.textContent?.includes("Create new payroll type"),
  );
  if (!createOption) return;
  const existing = new Set(Array.from(select.options).map(option => option.value));
  for (const type of runTypes) {
    if (existing.has(type)) continue;
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
    select.insertBefore(option, createOption);
    existing.add(type);
  }
}

/** Keeps the historical Runs selector in sync with the persisted run-type
 * registry until the legacy New Run form is extracted into a dedicated setup
 * component. */
export function PayrollRunTypeBoundary({ children }: { children: React.ReactNode }) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [runTypes, setRunTypes] = React.useState<string[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/payroll/v1/run-types", { credentials: "include", cache: "no-store" })
      .then(async response => {
        if (!response.ok) return null;
        return response.json();
      })
      .then(payload => {
        if (!cancelled && Array.isArray(payload?.data?.runTypes)) {
          setRunTypes(payload.data.runTypes.map(String));
        }
      })
      .catch(() => null);
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || !runTypes.length) return;
    const sync = () => {
      for (const select of root.querySelectorAll<HTMLSelectElement>("select")) {
        syncSelect(select, runTypes);
      }
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [runTypes]);

  return <div ref={rootRef}>{children}</div>;
}
