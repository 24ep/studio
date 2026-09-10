"use client";

import type { Dispatch, SetStateAction } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion } from '@/components/ui/accordion';
import {
    OrganizationInfoFields,
    OrganizationLogoField,
    OrganizationSettingsSection,
} from './OrganizationTabParts';
import type { OrganizationProfile } from '@/lib/organization-profile';

interface OrganizationTabProps {
    organizationName: string;
    setOrganizationName: (val: string) => void;
    organizationAddress: string;
    setOrganizationAddress: (val: string) => void;
    organizationContact: string;
    setOrganizationContact: (val: string) => void;
    organizationProfile: OrganizationProfile;
    setOrganizationProfile: Dispatch<SetStateAction<OrganizationProfile>>;
    organizationLogoPreviewUrl: string | null;
    setOrganizationLogoPreviewUrl: (val: string | null) => void;
    setSavedOrganizationLogoUrl: (val: string | null) => void;
    isSaving: boolean;
}

export default function OrganizationTab({
    organizationName,
    setOrganizationName,
    organizationAddress,
    setOrganizationAddress,
    organizationContact,
    setOrganizationContact,
    organizationProfile,
    setOrganizationProfile,
    organizationLogoPreviewUrl,
    setOrganizationLogoPreviewUrl,
    setSavedOrganizationLogoUrl,
    isSaving,
}: OrganizationTabProps) {
    return (
        <ScrollArea className="h-full">
            <Accordion
                type="multiple"
                defaultValue={['branding', 'identity', 'contact', 'address', 'regional', 'custom']}
                className="w-full"
            >
                <OrganizationSettingsSection
                    value="branding"
                    title="Branding"
                    description="Manage the organization logo used in reports and generated documents."
                >
                    <OrganizationLogoField
                        isSaving={isSaving}
                        organizationLogoPreviewUrl={organizationLogoPreviewUrl}
                        setOrganizationLogoPreviewUrl={setOrganizationLogoPreviewUrl}
                        setSavedOrganizationLogoUrl={setSavedOrganizationLogoUrl}
                    />
                </OrganizationSettingsSection>
                <OrganizationInfoFields
                    isSaving={isSaving}
                    organizationAddress={organizationAddress}
                    organizationContact={organizationContact}
                    organizationName={organizationName}
                    organizationProfile={organizationProfile}
                    setOrganizationAddress={setOrganizationAddress}
                    setOrganizationContact={setOrganizationContact}
                    setOrganizationName={setOrganizationName}
                    setOrganizationProfile={setOrganizationProfile}
                />
            </Accordion>
        </ScrollArea>
    );
}
