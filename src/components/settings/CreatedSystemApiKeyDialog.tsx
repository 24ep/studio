"use client";

import { CheckCircle, Copy, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import type { SystemApiKeyActions } from './system-api-keys-dialog-types';

interface CreatedSystemApiKeyDialogProps {
  createdKey: string;
  createdKeyName: string;
  open: boolean;
  showCreatedKey: boolean;
  actions: Pick<
    SystemApiKeyActions,
    'closeCreatedKeyDialog' | 'handleCopyKey' | 'setShowCreatedKey'
  >;
}

export function CreatedSystemApiKeyDialog({
  actions,
  createdKey,
  createdKeyName,
  open,
  showCreatedKey,
}: CreatedSystemApiKeyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={actions.closeCreatedKeyDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            API Key Created
          </DialogTitle>
          <DialogDescription>
            Save this key now - it will only be shown once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <CreatedSystemApiKeyValue
            createdKey={createdKey}
            createdKeyName={createdKeyName}
            showCreatedKey={showCreatedKey}
            onCopyKey={actions.handleCopyKey}
            onToggleKeyVisibility={() => actions.setShowCreatedKey(!showCreatedKey)}
          />

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            <strong>Important:</strong> This is the only time you will see this key. Copy it now and store it securely.
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => actions.closeCreatedKeyDialog(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreatedSystemApiKeyValue({
  createdKey,
  createdKeyName,
  showCreatedKey,
  onCopyKey,
  onToggleKeyVisibility,
}: {
  createdKey: string;
  createdKeyName: string;
  showCreatedKey: boolean;
  onCopyKey: () => void;
  onToggleKeyVisibility: () => void;
}) {
  return (
    <div className="rounded-lg bg-muted p-4">
      <Label className="text-sm font-medium">{createdKeyName}</Label>
      <div className="mt-2 flex items-center gap-2">
        <code className="flex-1 break-all rounded border bg-background p-2 font-mono text-sm">
          {showCreatedKey ? createdKey : '*'.repeat(40)}
        </code>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleKeyVisibility}
        >
          {showCreatedKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="sm" onClick={onCopyKey}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
