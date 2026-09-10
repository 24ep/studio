"use client";

import { useEffect, useMemo, useRef, useState } from 'react';

import { useToast } from '@/hooks/use-toast';
import { fetchWebhookBodyPreview } from './webhook-body-customization-api';
import type {
  FieldMapping,
  WebhookBodyConfig,
  WebhookBodyCustomizationInitialConfig,
} from './webhook-body-customization-types';
import {
  buildWebhookBodySavePayload,
  indexWebhookBodyConfigs,
  resolveWebhookPreviewConfig,
} from './webhook-body-customization-utils';
import { useWebhookBodyCustomizationData } from './use-webhook-body-customization-data';
import { useWebhookBodyFieldMappings } from './use-webhook-body-field-mappings';

interface UseWebhookBodyCustomizationParams {
  webhookEvents: string[];
  initialConfig?: WebhookBodyCustomizationInitialConfig;
  onSave: (config: unknown) => Promise<void>;
}

export function useWebhookBodyCustomization({
  webhookEvents,
  initialConfig,
  onSave,
}: UseWebhookBodyCustomizationParams) {
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<unknown>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [customPayload, setCustomPayload] = useState(initialConfig?.custom_payload ?? false);
  const [includeMetadata, setIncludeMetadata] = useState(initialConfig?.include_metadata ?? true);
  const [globalBodyTemplate, setGlobalBodyTemplate] = useState(initialConfig?.body_template ?? '');
  const [globalFieldMappings, setGlobalFieldMappings] = useState<FieldMapping[]>(initialConfig?.field_mappings ?? []);
  const [bodyConfigs, setBodyConfigs] = useState<Record<string, WebhookBodyConfig>>(
    indexWebhookBodyConfigs(initialConfig?.body_configs)
  );
  const lastSavedConfigRef = useRef<string | null>(null);

  const { error: showError } = useToast();
  const {
    availableFields,
    samplePayloads,
    selectedEvent,
    setSelectedEvent,
  } = useWebhookBodyCustomizationData(webhookEvents);
  const fieldMappingActions = useWebhookBodyFieldMappings({
    bodyConfigs,
    globalBodyTemplate,
    globalFieldMappings,
    setBodyConfigs,
    setGlobalFieldMappings,
  });

  const serializedConfig = useMemo(() => JSON.stringify(buildWebhookBodySavePayload({
    customPayload,
    includeMetadata,
    globalBodyTemplate,
    globalFieldMappings,
    bodyConfigs,
  })), [
    bodyConfigs,
    customPayload,
    globalBodyTemplate,
    globalFieldMappings,
    includeMetadata,
  ]);

  useEffect(() => {
    if (lastSavedConfigRef.current === null) {
      lastSavedConfigRef.current = serializedConfig;
      return;
    }
    if (serializedConfig === lastSavedConfigRef.current) {
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        await onSave(JSON.parse(serializedConfig));
        lastSavedConfigRef.current = serializedConfig;
      } catch {
        showError('Failed to save webhook body configuration');
      } finally {
        setLoading(false);
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [onSave, serializedConfig, showError]);

  const generatePreview = async () => {
    if (!selectedEvent) return;

    try {
      setPreviewLoading(true);
      const config = resolveWebhookPreviewConfig({
        selectedEvent,
        bodyConfigs,
        globalBodyTemplate,
        globalFieldMappings,
      });

      const preview = await fetchWebhookBodyPreview({
        eventType: selectedEvent,
        bodyTemplate: config.body_template,
        fieldMappings: config.field_mappings,
      });

      setPreviewData(preview);
      setShowPreview(true);
    } catch {
      showError('Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  return {
    isOpen,
    setIsOpen,
    loading,
    availableFields,
    samplePayloads,
    selectedEvent,
    setSelectedEvent,
    showPreview,
    previewData,
    previewLoading,
    customPayload,
    setCustomPayload,
    includeMetadata,
    setIncludeMetadata,
    globalBodyTemplate,
    setGlobalBodyTemplate,
    globalFieldMappings,
    bodyConfigs,
    ...fieldMappingActions,
    generatePreview,
  };
}

export type WebhookBodyCustomizationController = ReturnType<typeof useWebhookBodyCustomization>;
