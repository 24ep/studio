"use client";

import { Copy, Loader2, QrCode } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { sanitizeUrl } from '@/lib/utils';
import {
  formatEvaluationLinkCountdown,
  type EvalLinkItem,
} from './evaluation-links-tab-utils';

interface EvaluationLinksListProps {
  items: EvalLinkItem[];
  loading: boolean;
  updatingRequireLogin: Set<string>;
  onOpenQrCode: (item: EvalLinkItem) => void;
  onRevoke: (id: string) => void;
  onUpdateRequireLogin: (id: string, requireLogin: boolean) => void;
}

export function EvaluationLinksList({
  items,
  loading,
  updatingRequireLogin,
  onOpenQrCode,
  onRevoke,
  onUpdateRequireLogin,
}: EvaluationLinksListProps) {
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="grid grid-cols-12 bg-muted px-3 py-2 text-xs font-medium">
        <div className="col-span-2">applicant</div>
        <div className="col-span-3">Link</div>
        <div className="col-span-2">Expires</div>
        <div className="col-span-1">Owner</div>
        <div className="col-span-1 text-center">Login</div>
        <div className="col-span-1 text-center">Status</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">No links found.</div>
      ) : (
        items.map((item) => (
          <EvaluationLinksListRow
            key={item.id}
            item={item}
            isUpdatingRequireLogin={updatingRequireLogin.has(item.id)}
            onOpenQrCode={onOpenQrCode}
            onRevoke={onRevoke}
            onUpdateRequireLogin={onUpdateRequireLogin}
          />
        ))
      )}
    </div>
  );
}

function EvaluationLinksListRow({
  item,
  isUpdatingRequireLogin,
  onOpenQrCode,
  onRevoke,
  onUpdateRequireLogin,
}: {
  item: EvalLinkItem;
  isUpdatingRequireLogin: boolean;
  onOpenQrCode: (item: EvalLinkItem) => void;
  onRevoke: (id: string) => void;
  onUpdateRequireLogin: (id: string, requireLogin: boolean) => void;
}) {
  const countdown = formatEvaluationLinkCountdown(item.expiresAt, item.revokedAt);
  const isExpired = countdown === 'expired';
  const isRevoked = countdown === 'revoked';
  const safeUrl = sanitizeUrl(item.url);

  return (
    <div className="grid grid-cols-12 px-3 py-3 border-t text-sm items-center">
      <div className="col-span-2">
        <div className="font-medium">{item.applicant?.name || 'Unknown'}</div>
        <div className="text-xs text-muted-foreground">{item.applicant?.email}</div>
      </div>
      <div className="col-span-3 truncate flex items-center gap-2">
        <div className="truncate flex-1">
          {safeUrl ? (
            <a className="text-primary underline block truncate" href={safeUrl} target="_blank" rel="noreferrer">{item.url}</a>
          ) : (
            <span className="text-muted-foreground block truncate">{item.url}</span>
          )}
          <div className="text-xs text-muted-foreground break-all">{item.token}</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Copy evaluation link"
          className="h-6 w-6 shrink-0"
          onClick={() => navigator.clipboard.writeText(item.url).then(() => toast.success('Copied'))}
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      <div className="col-span-2">
        <div className="text-xs text-muted-foreground">{new Date(item.expiresAt).toLocaleString()}</div>
        <div className="text-xs">{countdown}</div>
      </div>
      <div className="col-span-1">
        <div className="font-medium text-xs truncate" title={item.createdBy?.name}>{item.createdBy?.name || 'Unknown'}</div>
      </div>
      <div className="col-span-1 flex justify-center">
        <Switch
          checked={item.requireLogin}
          onCheckedChange={(checked) => onUpdateRequireLogin(item.id, checked)}
          disabled={isUpdatingRequireLogin || isRevoked}
        />
      </div>
      <div className="col-span-1 flex justify-center">
        <Switch
          checked={!isRevoked && !isExpired}
          onCheckedChange={(checked) => {
            if (!checked) onRevoke(item.id);
          }}
          disabled={isRevoked || isExpired}
          title={isRevoked ? 'Revoked' : isExpired ? 'Expired' : 'Active'}
          className={isRevoked || isExpired ? "opacity-50" : ""}
        />
      </div>
      <div className="col-span-2 text-right">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => onOpenQrCode(item)}>
          <QrCode className="h-4 w-4" />
          QR Code
        </Button>
      </div>
    </div>
  );
}
