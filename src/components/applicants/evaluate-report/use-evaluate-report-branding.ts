"use client";

import { useCallback, useEffect, useState } from 'react';

import { loadReportHeaderPreferences } from './evaluate-report-section-api';

export function useEvaluateReportBranding() {
    const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);
    const [organizationLogoUrl, setOrganizationLogoUrl] = useState<string | null>(null);
    const [organizationName, setOrganizationName] = useState<string | null>(null);
    const [organizationAddress, setOrganizationAddress] = useState<string | null>(null);
    const [organizationContact, setOrganizationContact] = useState<string | null>(null);

    const fetchHeaderSettings = useCallback(async () => {
        try {
            const headerPreferences = await loadReportHeaderPreferences();
            if (!headerPreferences) return;

            setAppLogoUrl(headerPreferences.appLogoUrl);
            setOrganizationLogoUrl(headerPreferences.organizationLogoUrl);
            setOrganizationName(headerPreferences.organizationName);
            setOrganizationAddress(headerPreferences.organizationAddress);
            setOrganizationContact(headerPreferences.organizationContact);
        } catch {
            // Header branding is optional for report rendering.
        }
    }, []);

    useEffect(() => {
        void fetchHeaderSettings();
    }, [fetchHeaderSettings]);

    return {
        appLogoUrl,
        organizationLogoUrl,
        organizationName,
        organizationAddress,
        organizationContact,
    };
}
