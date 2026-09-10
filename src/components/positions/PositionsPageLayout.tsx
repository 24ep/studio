"use client";

import { PositionsPageLayoutModals } from "./PositionsPageLayoutModals";
import { PositionsPageMainContent } from "./PositionsPageMainContent";
import type { PositionsPageController } from "./use-positions-page-controller";

interface PositionsPageLayoutProps {
  page: PositionsPageController;
}

export function PositionsPageLayout({ page }: PositionsPageLayoutProps) {
  return (
    <div className="w-full h-full positions-page-container overflow-hidden">
      <PositionsPageMainContent page={page} />
      <PositionsPageLayoutModals page={page} />
    </div>
  );
}
