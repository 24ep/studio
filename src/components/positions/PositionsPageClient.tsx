"use client";

import { PositionsPageLayout } from "./PositionsPageLayout";
import { usePositionsPageController } from "./use-positions-page-controller";

export default function PositionsPageClient() {
  const page = usePositionsPageController();

  return <PositionsPageLayout page={page} />;
}
