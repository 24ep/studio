import { ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface EvaluationReportDrawerProps {
  isOpen: boolean;
  applicantId: string;
  onOpenChange: (open: boolean) => void;
  onOpenInNewPage: () => void;
}

export function EvaluationReportDrawer({
  isOpen,
  applicantId,
  onOpenChange,
  onOpenInNewPage,
}: EvaluationReportDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .report-drawer-content {
            width: 50vw !important;
          }
        `,
      }} />
      <SheetContent
        side="right"
        className="p-0 overflow-hidden report-drawer-content"
      >
        <div className="h-full flex flex-col">
          <SheetHeader className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-bold">Evaluation Report</SheetTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenInNewPage}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open in New Page</span>
                </Button>
              </div>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            <iframe
              src={`/applicants/${applicantId}/evaluate-result`}
              className="w-full h-full border-0"
              title="Evaluation Report"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
