"use client";

import { useEffect, useState } from 'react';

import { fetchWebhookAvailableFields } from './webhook-body-customization-api';

export function useWebhookBodyCustomizationData(webhookEvents: string[]) {
  const [availableFields, setAvailableFields] = useState<Record<string, string[]>>({});
  const [samplePayloads, setSamplePayloads] = useState<Record<string, unknown>>({});
  const [selectedEvent, setSelectedEvent] = useState('');

  useEffect(() => {
    const loadAvailableFields = async () => {
      try {
        const data = await fetchWebhookAvailableFields();
        setAvailableFields(data.fields);
        setSamplePayloads(data.samples);
      } catch (error) {
        console.error('Error loading available fields:', error);
      }
    };

    void loadAvailableFields();
  }, []);

  useEffect(() => {
    if (webhookEvents.length > 0 && !selectedEvent) {
      setSelectedEvent(webhookEvents[0]);
    }
  }, [webhookEvents, selectedEvent]);

  return {
    availableFields,
    samplePayloads,
    selectedEvent,
    setSelectedEvent,
  };
}
