"use client";

import { useIsMobile } from '@/hooks/use-mobile';
import { EvaluationLinkQrDialog } from './EvaluationLinkQrDialog';
import { EvaluationLinksList } from './EvaluationLinksList';
import { EvaluationLinksPagination } from './EvaluationLinksPagination';
import { EvaluationLinksToolbar } from './EvaluationLinksToolbar';
import { useEvaluationLinksTab } from './use-evaluation-links-tab';

export default function EvaluationLinksTab() {
  const isMobile = useIsMobile();
  const controller = useEvaluationLinksTab();

  return (
    <div className="space-y-4">
      <EvaluationLinksToolbar
        q={controller.q}
        status={controller.status}
        onQChange={controller.setQ}
        onStatusChange={controller.setStatus}
      />

      <EvaluationLinksList
        items={controller.items}
        loading={controller.loading}
        updatingRequireLogin={controller.updatingRequireLogin}
        onOpenQrCode={controller.openQrCode}
        onRevoke={controller.revoke}
        onUpdateRequireLogin={controller.updateRequireLogin}
      />

      <EvaluationLinksPagination
        itemCount={controller.items.length}
        total={controller.total}
        offset={controller.offset}
        limit={controller.limit}
        onOffsetChange={controller.setOffset}
      />

      <EvaluationLinkQrDialog
        isMobile={isMobile}
        open={controller.qrModalOpen}
        qrData={controller.qrData}
        appLogoUrl={controller.appLogoUrl}
        onOpenChange={controller.setQrModalOpen}
      />
    </div>
  );
}
