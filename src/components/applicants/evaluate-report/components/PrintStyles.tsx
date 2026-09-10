"use client";

import { buildEvaluateReportPrintCss } from './evaluate-report-print-css';

interface PrintStylesProps {
  isInIframe: boolean;
}

export function PrintStyles({ isInIframe }: PrintStylesProps) {
  return (
    <style dangerouslySetInnerHTML={{
      __html: buildEvaluateReportPrintCss(isInIframe),
    }} />
  );
}
