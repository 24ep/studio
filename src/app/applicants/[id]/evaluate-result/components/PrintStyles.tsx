"use client";

import { buildEvaluateResultPrintCss } from './evaluate-result-print-css';

interface PrintStylesProps {
  isInIframe: boolean;
}

export function PrintStyles({ isInIframe }: PrintStylesProps) {
  return (
    <style dangerouslySetInnerHTML={{
      __html: buildEvaluateResultPrintCss(isInIframe),
    }} />
  );
}

