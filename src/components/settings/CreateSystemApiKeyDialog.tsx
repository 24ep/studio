"use client";

import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import type { SystemApiKeyExpirationOption } from './system-api-keys-utils';
import type { SystemApiKeyActions } from './system-api-keys-dialog-types';

interface CreateSystemApiKeyDialogProps {
  isSaving: boolean;
  newKeyCustomExpiration: string;
  newKeyDescription: string;
  newKeyExpiration: SystemApiKeyExpirationOption;
  newKeyName: string;
  open: boolean;
  actions: Pick<
    SystemApiKeyActions,
    | 'handleCreateKey'
    | 'setNewKeyCustomExpiration'
    | 'setNewKeyDescription'
    | 'setNewKeyExpiration'
    | 'setNewKeyName'
    | 'setShowCreateDialog'
  >;
}

export function CreateSystemApiKeyDialog({
  actions,
  isSaving,
  newKeyCustomExpiration,
  newKeyDescription,
  newKeyExpiration,
  newKeyName,
  open,
}: CreateSystemApiKeyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={actions.setShowCreateDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New API Key</DialogTitle>
          <DialogDescription>
            Create an API key for external system integration. The key will only be shown once after creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="key-name">Name *</Label>
            <Input
              id="key-name"
              placeholder="e.g., n8n Integration"
              value={newKeyName}
              onChange={(event) => actions.setNewKeyName(event.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="key-description">Description</Label>
            <Textarea
              id="key-description"
              placeholder="Optional description of what this key is used for"
              value={newKeyDescription}
              onChange={(event) => actions.setNewKeyDescription(event.target.value)}
              rows={2}
            />
          </div>

          <SystemApiKeyExpirationField
            customExpiration={newKeyCustomExpiration}
            expiration={newKeyExpiration}
            onCustomExpirationChange={actions.setNewKeyCustomExpiration}
            onExpirationChange={actions.setNewKeyExpiration}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => actions.setShowCreateDialog(false)}>
            Cancel
          </Button>
          <Button onClick={actions.handleCreateKey} disabled={isSaving || !newKeyName.trim()}>
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create API Key'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SystemApiKeyExpirationField({
  customExpiration,
  expiration,
  onCustomExpirationChange,
  onExpirationChange,
}: {
  customExpiration: string;
  expiration: SystemApiKeyExpirationOption;
  onCustomExpirationChange: (value: string) => void;
  onExpirationChange: (value: SystemApiKeyExpirationOption) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Expiration</Label>
      <Select value={expiration} onValueChange={(value) => onExpirationChange(value as SystemApiKeyExpirationOption)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="never">Never expires</SelectItem>
          <SelectItem value="30days">30 days</SelectItem>
          <SelectItem value="90days">90 days</SelectItem>
          <SelectItem value="1year">1 year</SelectItem>
          <SelectItem value="custom">Custom date</SelectItem>
        </SelectContent>
      </Select>
      {expiration === 'custom' && (
        <Input
          type="datetime-local"
          value={customExpiration}
          onChange={(event) => onCustomExpirationChange(event.target.value)}
          min={new Date().toISOString().slice(0, 16)}
        />
      )}
    </div>
  );
}
