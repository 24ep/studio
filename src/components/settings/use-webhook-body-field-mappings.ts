"use client";

import type { Dispatch, SetStateAction } from 'react';

import type {
  FieldMapping,
  WebhookBodyConfig,
} from './webhook-body-customization-types';
import {
  appendEmptyFieldMapping,
  createWebhookEventBodyConfig,
  removeFieldMapping,
  updateFieldMapping,
} from './webhook-body-customization-utils';

interface UseWebhookBodyFieldMappingsOptions {
  bodyConfigs: Record<string, WebhookBodyConfig>;
  globalBodyTemplate: string;
  globalFieldMappings: FieldMapping[];
  setBodyConfigs: Dispatch<SetStateAction<Record<string, WebhookBodyConfig>>>;
  setGlobalFieldMappings: Dispatch<SetStateAction<FieldMapping[]>>;
}

export function useWebhookBodyFieldMappings({
  bodyConfigs,
  globalBodyTemplate,
  globalFieldMappings,
  setBodyConfigs,
  setGlobalFieldMappings,
}: UseWebhookBodyFieldMappingsOptions) {
  const addGlobalFieldMapping = () => {
    setGlobalFieldMappings((prev) => appendEmptyFieldMapping(prev));
  };

  const removeGlobalFieldMapping = (index: number) => {
    setGlobalFieldMappings((prev) => removeFieldMapping(prev, index));
  };

  const updateGlobalFieldMapping = (index: number, field: keyof FieldMapping, value: unknown) => {
    setGlobalFieldMappings((prev) => updateFieldMapping(prev, index, field, value));
  };

  const addEventConfig = (eventType: string) => {
    setBodyConfigs((prev) => ({
      ...prev,
      [eventType]: createWebhookEventBodyConfig(eventType, globalBodyTemplate, globalFieldMappings),
    }));
  };

  const removeEventConfig = (eventType: string) => {
    setBodyConfigs((prev) => {
      const newConfigs = { ...prev };
      delete newConfigs[eventType];
      return newConfigs;
    });
  };

  const updateEventConfig = (eventType: string, field: keyof WebhookBodyConfig, value: unknown) => {
    setBodyConfigs((prev) => ({
      ...prev,
      [eventType]: {
        ...prev[eventType],
        [field]: value,
      },
    }));
  };

  const addEventFieldMapping = (eventType: string) => {
    const currentConfig = bodyConfigs[eventType];
    if (currentConfig) {
      updateEventConfig(eventType, 'field_mappings', appendEmptyFieldMapping(currentConfig.field_mappings));
    }
  };

  const removeEventFieldMapping = (eventType: string, index: number) => {
    const currentConfig = bodyConfigs[eventType];
    if (currentConfig) {
      updateEventConfig(
        eventType,
        'field_mappings',
        removeFieldMapping(currentConfig.field_mappings, index)
      );
    }
  };

  const updateEventFieldMapping = (eventType: string, index: number, field: keyof FieldMapping, value: unknown) => {
    const currentConfig = bodyConfigs[eventType];
    if (currentConfig) {
      updateEventConfig(
        eventType,
        'field_mappings',
        updateFieldMapping(currentConfig.field_mappings, index, field, value)
      );
    }
  };

  return {
    addEventConfig,
    addEventFieldMapping,
    addGlobalFieldMapping,
    removeEventConfig,
    removeEventFieldMapping,
    removeGlobalFieldMapping,
    updateEventConfig,
    updateEventFieldMapping,
    updateGlobalFieldMapping,
  };
}
