"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

const focusLabels: Record<string, string[]> = {
  "bank-details": ["bank information", "bank details", "payment information"],
  "tax-details": ["tax information", "tax details", "tax identification"],
  "payroll-group": ["payroll group", "payroll"],
  "payroll-profile": ["payroll profile", "payroll"],
};

function findByText(labels: string[]) {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(
      'button,[role="tab"],h2,h3,h4,label,dt,[data-focus-target]',
    ),
  );
  return candidates.find(node => {
    const text = node.textContent?.trim().toLowerCase() || "";
    return labels.some(label => text === label || text.includes(label));
  });
}

function highlight(node: HTMLElement) {
  const target = node.closest<HTMLElement>('section,article,[role="tabpanel"],div') || node;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.dataset.payrollFocus = "true";
  target.classList.add("ring-2", "ring-primary/60", "ring-offset-2", "ring-offset-background");
  window.setTimeout(() => {
    target.classList.remove("ring-2", "ring-primary/60", "ring-offset-2", "ring-offset-background");
    delete target.dataset.payrollFocus;
  }, 3500);
}

/**
 * Payroll blockers already deep-link to People with ?focus=. This bridge keeps
 * that contract useful without coupling Payroll to the large employee profile
 * implementation. It opens the Payroll tab when required and focuses the most
 * specific matching field/section once profile content is mounted.
 */
export function PayrollEmployeeFocusBridge() {
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus") || "";

  React.useEffect(() => {
    const labels = focusLabels[focus];
    if (!labels?.length) return;
    let completed = false;
    let attempts = 0;

    const run = () => {
      if (completed) return;
      attempts += 1;

      if (focus === "payroll-group" || focus === "payroll-profile") {
        const payrollTab = findByText(["payroll"]);
        if (payrollTab instanceof HTMLButtonElement && payrollTab.getAttribute("aria-selected") !== "true") {
          payrollTab.click();
          return;
        }
      }

      const target = findByText(labels);
      if (target) {
        completed = true;
        highlight(target);
        const url = new URL(window.location.href);
        url.searchParams.delete("focus");
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
      }
    };

    run();
    const observer = new MutationObserver(run);
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = window.setInterval(() => {
      if (completed || attempts > 20) {
        window.clearInterval(timer);
        observer.disconnect();
        return;
      }
      run();
    }, 250);

    return () => {
      window.clearInterval(timer);
      observer.disconnect();
    };
  }, [focus]);

  return null;
}
