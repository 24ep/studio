import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import type { WebhookBodyCustomizationController } from './use-webhook-body-customization';

interface WebhookBodyCustomizationFooterProps {
  controller: WebhookBodyCustomizationController;
}

export function WebhookBodyCustomizationFooter({
  controller,
}: WebhookBodyCustomizationFooterProps) {
  const {
    loading,
    setIsOpen,
  } = controller;

  return (
    <DialogFooter className="px-6 py-4 border-t">
      {loading && (
        <span className="mr-auto flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted border-b-primary" />
          Saving
        </span>
      )}
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Close
      </Button>
    </DialogFooter>
  );
}
