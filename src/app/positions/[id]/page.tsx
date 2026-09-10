"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { PositionDetailDrawer } from "@/components/positions/PositionDetailDrawer";
import { normalizePositionListResponse } from "@/components/positions/position-page-utils";

export default function PositionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const positionId = params.id as string;
  const isStaticPreview = positionId === "preview" && searchParams.get("demo") === "true";
  const [resolvedPositionId, setResolvedPositionId] = useState<string | null>(
    positionId === "preview" && !isStaticPreview ? null : positionId,
  );

  useEffect(() => {
    if (isStaticPreview) {
      setResolvedPositionId("preview");
      return;
    }

    if (positionId !== "preview") {
      setResolvedPositionId(positionId);
      return;
    }

    let cancelled = false;

    async function resolveDatabasePosition() {
      try {
        const response = await fetch("/api/positions?limit=1&offset=0", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load a position");
        const payload = await response.json() as unknown;
        const firstPosition = normalizePositionListResponse(payload).positions[0];
        if (cancelled) return;
        if (!firstPosition) {
          router.replace("/positions");
          return;
        }

        const suffix = searchParams.get("edit") === "true" ? "?edit=true" : "";
        setResolvedPositionId(firstPosition.id);
        router.replace(`/positions/${firstPosition.id}${suffix}`, { scroll: false });
      } catch {
        if (!cancelled) router.replace("/positions");
      }
    }

    void resolveDatabasePosition();
    return () => {
      cancelled = true;
    };
  }, [isStaticPreview, positionId, router, searchParams]);

  if (!resolvedPositionId) {
    return (
      <div className="grid h-full min-h-0 place-items-center bg-background text-sm text-muted-foreground" role="status">
        Loading position from the database...
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 bg-white">
      <PositionDetailDrawer
        isOpen
        initialEditMode={searchParams.get("edit") === "true"}
        onOpenChange={(open) => {
          if (!open) router.push("/positions");
        }}
        positionId={resolvedPositionId}
        presentation="page"
      />
    </div>
  );
}
