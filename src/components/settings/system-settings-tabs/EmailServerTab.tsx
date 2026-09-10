"use client";

import React from 'react';
import { toast } from 'react-hot-toast';

import { ScrollArea } from '@/components/ui/scroll-area';

import {
    EmailServerFields,
    EmailServiceSectionTitle,
    SwitchRow
} from './EmailServerTabParts';
import { testEmailConnection } from './email-server-test-utils';
import type { EmailServerTabProps } from './email-server-tab-types';

export default function EmailServerTab({
    emailServiceEnabled,
    setEmailServiceEnabled,
    emailProvider,
    setEmailProvider,
    emailApiKey,
    setEmailApiKey,
    emailMailgunDomain,
    setEmailMailgunDomain,
    emailSmtpHost,
    setEmailSmtpHost,
    emailSmtpPort,
    setEmailSmtpPort,
    emailSmtpSecure,
    setEmailSmtpSecure,
    emailSmtpUser,
    setEmailSmtpUser,
    emailSmtpPassword,
    setEmailSmtpPassword,
    emailFromAddress,
    setEmailFromAddress,
    emailFromName,
    setEmailFromName,
    showSmtpPassword,
    setShowSmtpPassword,
    isSaving,
    testingEmail,
    setTestingEmail,
}: EmailServerTabProps) {
    const [targetEmail, setTargetEmail] = React.useState('');

    const handleTestConnection = async () => {
        setTestingEmail(true);
        try {
            const data = await testEmailConnection({
                provider: emailProvider,
                apiKey: emailApiKey,
                mailgunDomain: emailMailgunDomain,
                host: emailSmtpHost,
                port: emailSmtpPort,
                secure: emailSmtpSecure,
                user: emailSmtpUser,
                password: emailSmtpPassword,
                fromAddress: emailFromAddress,
                fromName: emailFromName,
                targetEmail,
            });

            if (data.success) {
                toast.success(`Test email sent to ${targetEmail}`);
            } else {
                toast.error(data.error || 'Connection test failed');
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Connection test failed');
        } finally {
            setTestingEmail(false);
        }
    };

    return (
        <ScrollArea className="h-full">
            <section className="border-b px-6 py-5">
                <EmailServiceSectionTitle />
                <div className="mt-5 space-y-4">
                    <SwitchRow
                        id="email-service-enabled"
                        label="Enable Email Service"
                        description="Enable or disable email sending functionality. When enabled, the system can send interview invitations and notifications."
                        checked={emailServiceEnabled}
                        onCheckedChange={setEmailServiceEnabled}
                        disabled={isSaving}
                        muted
                    />

                    {emailServiceEnabled && (
                        <EmailServerFields
                            emailProvider={emailProvider}
                            setEmailProvider={setEmailProvider}
                            emailApiKey={emailApiKey}
                            setEmailApiKey={setEmailApiKey}
                            emailMailgunDomain={emailMailgunDomain}
                            setEmailMailgunDomain={setEmailMailgunDomain}
                            emailSmtpHost={emailSmtpHost}
                            setEmailSmtpHost={setEmailSmtpHost}
                            emailSmtpPort={emailSmtpPort}
                            setEmailSmtpPort={setEmailSmtpPort}
                            emailSmtpSecure={emailSmtpSecure}
                            setEmailSmtpSecure={setEmailSmtpSecure}
                            emailSmtpUser={emailSmtpUser}
                            setEmailSmtpUser={setEmailSmtpUser}
                            emailSmtpPassword={emailSmtpPassword}
                            setEmailSmtpPassword={setEmailSmtpPassword}
                            emailFromAddress={emailFromAddress}
                            setEmailFromAddress={setEmailFromAddress}
                            emailFromName={emailFromName}
                            setEmailFromName={setEmailFromName}
                            showSmtpPassword={showSmtpPassword}
                            setShowSmtpPassword={setShowSmtpPassword}
                            isSaving={isSaving}
                            testingEmail={testingEmail}
                            targetEmail={targetEmail}
                            setTargetEmail={setTargetEmail}
                            onTestConnection={handleTestConnection}
                        />
                    )}
                </div>
            </section>
        </ScrollArea>
    );
}
