"use client";

import { Eye, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { platformSetupFeatures } from '@/lib/admin-platform-setup';
import type { AppKitSetupPreviewGroup } from '@/lib/appkit-setup-preview';

interface AdminPlatformSetupPreviewDialogProps {
  open: boolean;
  busy: boolean;
  loading: boolean;
  groups: AppKitSetupPreviewGroup[];
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function AdminPlatformSetupPreviewDialog({
  open,
  busy,
  loading,
  groups,
  onOpenChange,
  onConfirm,
}: AdminPlatformSetupPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !busy && onOpenChange(nextOpen)}>
      <DialogContent
        dialogId="admin-platform-setup-preview"
        className="max-h-[85vh] overflow-hidden p-0 sm:max-w-2xl"
      >
        <DialogHeader className="border-b px-6 pb-5 pt-6 pr-14">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Eye className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle>Preview AppKit data</DialogTitle>
              <DialogDescription className="mt-1 leading-5">
                Review the production starter data below. Nothing is saved until you confirm.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading preview from AppKit…
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => {
                const feature = platformSetupFeatures.find((item) => item.id === group.featureId);
                return (
                  <section key={group.featureId} className="rounded-lg border bg-muted/15 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold">{feature?.title || group.featureId}</h3>
                      <Badge variant="secondary">
                        {group.count} {group.count === 1 ? 'record' : 'records'}
                      </Badge>
                    </div>
                    {group.items.length ? (
                      <ul className="mt-3 divide-y text-sm">
                        {group.items.map((item, index) => (
                          <li key={`${item.label}-${index}`} className="py-2 first:pt-0 last:pb-0">
                            <p className="font-medium">{item.label}</p>
                            {item.detail && (
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                {item.detail}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">
                        No AppKit records were returned for this item.
                      </p>
                    )}
                    {group.count > group.items.length && (
                      <p className="mt-3 text-xs font-medium text-primary">
                        + {group.count - group.items.length} more
                      </p>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-6 py-4 sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Existing records may be updated by matching keys or names.
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" disabled={loading} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={loading || groups.length === 0} onClick={onConfirm}>
              Confirm and initialize
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
