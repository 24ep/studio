"use client";

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getJsonArray, getJsonErrorMessage, getJsonNumber, getJsonString, isJsonObject, readJsonObject, readJsonOrFallback } from '@/lib/response-json';
import type {
  EvalLinkItem,
  EvalLinkQrData,
  EvalLinkStatus,
} from './evaluation-links-tab-utils';

function normalizeEvaluationLinksResponse(value: unknown) {
  const data = isJsonObject(value) ? value : {};
  return {
    data: (getJsonArray(data, 'data') ?? []).filter(isJsonObject).map((item) => item as unknown as EvalLinkItem),
    total: getJsonNumber(data, 'total') ?? 0,
    limit: getJsonNumber(data, 'limit') ?? 20,
    offset: getJsonNumber(data, 'offset') ?? 0,
  };
}

export function useEvaluationLinksTab() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<EvalLinkStatus>('all');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<EvalLinkItem[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [updatingRequireLogin, setUpdatingRequireLogin] = useState<Set<string>>(new Set());
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState<EvalLinkQrData | null>(null);
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const data = await readJsonObject(await fetch('/api/settings/system-settings?keys=qrCodeLogo,appLogoDataUrl'));
        setAppLogoUrl(getJsonString(data, 'qrCodeLogo') ?? getJsonString(data, 'appLogoDataUrl') ?? null);
      } catch (error) {
        console.error('Failed to fetch QR code logo', error);
      }
    };

    void fetchLogo();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      params.set('limit', String(limit));
      params.set('offset', String(offset));

      const response = await fetch(`/api/v1/evaluation/links?${params.toString()}`, { credentials: 'include' });
      if (!response.ok) {
        const details = await readJsonObject(response);
        const hint = getJsonString(details, 'hint');
        const serverMessage = `${getJsonErrorMessage(details, 'Failed to load links')}${hint ? ` - ${hint}` : ''}`;
        throw new Error(serverMessage);
      }

      const data = normalizeEvaluationLinksResponse(await readJsonOrFallback<unknown>(response, {}));
      setItems(data.data);
      setTotal(data.total);
      setLimit(data.limit);
      setOffset(data.offset);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load links');
    } finally {
      setLoading(false);
    }
  }, [limit, offset, q, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = () => {
    if (offset === 0) {
      fetchData();
      return;
    }

    setOffset(0);
  };

  const revoke = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/evaluation/links/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!response.ok) throw new Error('Failed to disable link');
      toast.success('Link disabled');
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to disable link');
    }
  };

  const updateRequireLogin = async (id: string, requireLogin: boolean) => {
    try {
      setUpdatingRequireLogin(prev => new Set(prev).add(id));
      const response = await fetch(`/api/v1/evaluation/links/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ requireLogin }),
      });
      if (!response.ok) throw new Error('Failed to update login requirement');

      toast.success(`Login requirement ${requireLogin ? 'enabled' : 'disabled'}`);
      setItems(prev => prev.map(item => (
        item.id === id ? { ...item, requireLogin } : item
      )));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update login requirement');
    } finally {
      setUpdatingRequireLogin(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const openQrCode = (item: EvalLinkItem) => {
    setQrData({
      name: item.applicant?.name || 'applicant',
      url: item.url,
      expiresAt: item.expiresAt,
    });
    setQrModalOpen(true);
  };

  return {
    appLogoUrl,
    items,
    limit,
    loading,
    offset,
    q,
    qrData,
    qrModalOpen,
    status,
    total,
    updatingRequireLogin,
    setOffset,
    setQ,
    setQrModalOpen,
    setStatus,
    openQrCode,
    refresh,
    revoke,
    updateRequireLogin,
  };
}
