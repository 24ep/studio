"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchCreateEvaluateLinkAvailableUsers,
  fetchCreateEvaluateLinkAzureRooms,
  fetchCreateEvaluateLinkEmailTemplate,
  getDefaultCreateEvaluateLinkEmailTemplate,
} from "./create-evaluate-link-api";
import type {
  AzureMeetingRoom,
  User,
} from "./create-evaluate-link-utils";

export function useCreateEvaluateLinkReferenceResources({
  applicantId,
  isOpen,
}: {
  applicantId?: string;
  isOpen: boolean;
}) {
  const [azureRooms, setAzureRooms] = useState<AzureMeetingRoom[]>([]);
  const [azureMeetingRoomsEnabled, setAzureMeetingRoomsEnabled] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);

  const loadAvailableUsers = useCallback(async () => {
    try {
      setAvailableUsers(await fetchCreateEvaluateLinkAvailableUsers());
    } catch (error) {
      console.error("Error loading users:", error);
    }
  }, []);

  const loadEmailTemplate = useCallback(async () => {
    setLoadingTemplate(true);
    try {
      const templateSettings = await fetchCreateEvaluateLinkEmailTemplate();
      setEmailSubject(templateSettings.subject);
      setEmailBody(templateSettings.body);
      setAppLogoUrl(templateSettings.appLogoUrl);
    } catch (error) {
      console.error("Error loading email template:", error);
      const templateSettings = getDefaultCreateEvaluateLinkEmailTemplate();
      setEmailSubject(templateSettings.subject);
      setEmailBody(templateSettings.body);
    } finally {
      setLoadingTemplate(false);
    }
  }, []);

  const loadAzureRooms = useCallback(async () => {
    try {
      const rooms = await fetchCreateEvaluateLinkAzureRooms();
      setAzureRooms(rooms);
      setAzureMeetingRoomsEnabled(rooms.length > 0);
    } catch (error) {
      console.error("Error checking Azure meeting rooms setting:", error);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !applicantId) return;

    void loadAvailableUsers();
    void loadEmailTemplate();
  }, [applicantId, isOpen, loadAvailableUsers, loadEmailTemplate]);

  useEffect(() => {
    if (isOpen) {
      void loadAzureRooms();
    }
  }, [isOpen, loadAzureRooms]);

  const resetEmailTemplateFields = useCallback(() => {
    setEmailSubject("");
    setEmailBody("");
  }, []);

  return {
    appLogoUrl,
    availableUsers,
    azureMeetingRoomsEnabled,
    azureRooms,
    emailBody,
    emailSubject,
    loadingTemplate,
    resetEmailTemplateFields,
    setEmailBody,
    setEmailSubject,
  };
}
