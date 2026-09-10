"use client";

import React from 'react';
import { Settings } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { FeatureFlagSettingList, type FeatureFlagSetting } from './FeatureFlagsTabParts';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PublicApplicationMode } from '@/features/settings/system-settings-types';

interface FeatureFlagsTabProps {
    jobMatchFeatureEnabled: boolean;
    setJobMatchFeatureEnabled: (val: boolean) => void;
    exportImportFeatureEnabled: boolean;
    setExportImportFeatureEnabled: (val: boolean) => void;
    hiringManagerRestrictToAssignedPositions: boolean;
    setHiringManagerRestrictToAssignedPositions: (val: boolean) => void;
    interviewInvitationFeatureEnabled: boolean;
    setInterviewInvitationFeatureEnabled: (val: boolean) => void;
    publicApplicationsEnabled: boolean;
    setPublicApplicationsEnabled: (val: boolean) => void;
    publicApplicationMode: PublicApplicationMode;
    setPublicApplicationMode: (val: PublicApplicationMode) => void;
    publicApplicationsRequireCaptcha: boolean;
    setPublicApplicationsRequireCaptcha: (val: boolean) => void;
    publicApplicationsSendApplicantConfirmation: boolean;
    setPublicApplicationsSendApplicantConfirmation: (val: boolean) => void;
    publicApplicationsNotifyRecruiter: boolean;
    setPublicApplicationsNotifyRecruiter: (val: boolean) => void;
    isSaving: boolean;
}

export default function FeatureFlagsTab({
    jobMatchFeatureEnabled,
    setJobMatchFeatureEnabled,
    exportImportFeatureEnabled,
    setExportImportFeatureEnabled,
    hiringManagerRestrictToAssignedPositions,
    setHiringManagerRestrictToAssignedPositions,
    interviewInvitationFeatureEnabled,
    setInterviewInvitationFeatureEnabled,
    publicApplicationsEnabled,
    setPublicApplicationsEnabled,
    publicApplicationMode,
    setPublicApplicationMode,
    publicApplicationsRequireCaptcha,
    setPublicApplicationsRequireCaptcha,
    publicApplicationsSendApplicantConfirmation,
    setPublicApplicationsSendApplicantConfirmation,
    publicApplicationsNotifyRecruiter,
    setPublicApplicationsNotifyRecruiter,
    isSaving,
}: FeatureFlagsTabProps) {
    const featureSettings: FeatureFlagSetting[] = [
        {
            id: 'job-match-feature',
            title: 'Job Match Feature',
            description: 'Enable or disable the job match functionality. When disabled, all job match related UI components will be hidden.',
            checked: jobMatchFeatureEnabled,
            onCheckedChange: setJobMatchFeatureEnabled,
            disabled: isSaving,
        },
        {
            id: 'export-import-feature',
            title: 'Export/Import Feature',
            description: 'Enable or disable the data export and import functionality.',
            checked: exportImportFeatureEnabled,
            onCheckedChange: setExportImportFeatureEnabled,
            disabled: isSaving,
        },
        {
            id: 'hiring-manager-restrict',
            title: 'Hiring Manager Access Control',
            description: 'When enabled, hiring managers can only see positions and Applicants for positions where they are assigned as interviewers. When disabled, hiring managers can see all positions and Applicants.',
            checked: hiringManagerRestrictToAssignedPositions,
            onCheckedChange: setHiringManagerRestrictToAssignedPositions,
            disabled: isSaving,
        },
        {
            id: 'interview-invitation-feature',
            title: 'Interview Invitation Feature',
            description: 'Enable or disable the interview invitation feature. When disabled, the "Send Interviewer Invitation" button will be hidden.',
            checked: interviewInvitationFeatureEnabled,
            onCheckedChange: setInterviewInvitationFeatureEnabled,
            disabled: isSaving,
        },
        {
            id: 'public-applications-enabled',
            title: 'Public Applications',
            description: 'Allow unauthenticated candidates to submit applications through public apply pages.',
            checked: publicApplicationsEnabled,
            onCheckedChange: setPublicApplicationsEnabled,
            disabled: isSaving,
        },
        {
            id: 'public-applications-captcha',
            title: 'Public Apply Captcha',
            description: 'Require a signed verification challenge on public application submissions.',
            checked: publicApplicationsRequireCaptcha,
            onCheckedChange: setPublicApplicationsRequireCaptcha,
            disabled: isSaving || !publicApplicationsEnabled,
        },
        {
            id: 'public-applications-applicant-email',
            title: 'Applicant Confirmation Email',
            description: 'Send candidates an email confirmation after their public application is received.',
            checked: publicApplicationsSendApplicantConfirmation,
            onCheckedChange: setPublicApplicationsSendApplicantConfirmation,
            disabled: isSaving || !publicApplicationsEnabled,
        },
        {
            id: 'public-applications-recruiter-email',
            title: 'Recruiter Notification Email',
            description: 'Notify the assigned position recruiter when a public application is submitted.',
            checked: publicApplicationsNotifyRecruiter,
            onCheckedChange: setPublicApplicationsNotifyRecruiter,
            disabled: isSaving || !publicApplicationsEnabled,
        },
    ];

    return (
        <ScrollArea className="h-full">
            <Accordion type="multiple" defaultValue={['features']} className="w-full">
                <AccordionItem value="features" className="border-b">
                    <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-primary" />
                            <div className="text-left">
                                <div className="font-semibold">Feature Configuration</div>
                                <div className="text-xs text-muted-foreground font-normal">Enable or disable system features</div>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 pt-2">
                        <FeatureFlagSettingList settings={featureSettings} />
                        <div className="mt-5 grid gap-2 border-t pt-5">
                            <Label htmlFor="public-application-mode">Applicant entry method</Label>
                            <Select value={publicApplicationMode} onValueChange={(value) => setPublicApplicationMode(value as PublicApplicationMode)} disabled={isSaving || !publicApplicationsEnabled}>
                                <SelectTrigger id="public-application-mode" className="max-w-md"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="choice">Applicant chooses AI or manual</SelectItem>
                                    <SelectItem value="ai">AI resume upload only</SelectItem>
                                    <SelectItem value="manual">Manual details + resume only</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">Controls whether the public page sends a CV to AI processing, collects structured details manually, or offers both.</p>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </ScrollArea>
    );
}
