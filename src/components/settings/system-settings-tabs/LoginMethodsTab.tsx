"use client";

import { LogIn } from 'lucide-react';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';

interface LoginMethodsTabProps {
    basicAuthEnabled: boolean;
    setBasicAuthEnabled: (value: boolean) => void;
    azureAdClientId: string;
    azureAdTenantId: string;
    isSaving: boolean;
}

export default function LoginMethodsTab({
    basicAuthEnabled,
    setBasicAuthEnabled,
    azureAdClientId,
    azureAdTenantId,
    isSaving,
}: LoginMethodsTabProps) {
    const microsoftConfigured = Boolean(azureAdClientId.trim() && azureAdTenantId.trim());

    return (
        <ScrollArea className="h-full">
            <Accordion type="multiple" defaultValue={['login-methods']} className="w-full">
                <AccordionItem value="login-methods" className="border-b">
                    <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                            <LogIn className="h-5 w-5 text-primary" />
                            <div className="text-left">
                                <div className="font-semibold">Default Login Methods</div>
                                <div className="text-xs font-normal text-muted-foreground">
                                    Choose how employees sign in to the platform
                                </div>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2">
                        <div className="divide-y rounded-md border bg-card">
                            <div className="flex items-center justify-between gap-4 p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="basic-auth-enabled">Email and password</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Allow users to sign in with their platform credentials.
                                    </p>
                                </div>
                                <Switch
                                    id="basic-auth-enabled"
                                    checked={basicAuthEnabled}
                                    onCheckedChange={setBasicAuthEnabled}
                                    disabled={isSaving || (!microsoftConfigured && basicAuthEnabled)}
                                    aria-describedby="basic-auth-help"
                                />
                            </div>
                            <div className="flex items-center justify-between gap-4 p-4">
                                <div className="space-y-0.5">
                                    <Label>Microsoft</Label>
                                    <p id="basic-auth-help" className="text-sm text-muted-foreground">
                                        {microsoftConfigured
                                            ? 'Available on the login page using the configured Azure credentials.'
                                            : 'Configure a Client ID and Tenant ID in Azure Integration to enable Microsoft sign-in.'}
                                    </p>
                                </div>
                                <span className={microsoftConfigured
                                    ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                    : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                                }>
                                    {microsoftConfigured ? 'Configured' : 'Not configured'}
                                </span>
                            </div>
                        </div>

                        {!microsoftConfigured && (
                            <p className="mt-4 text-xs text-muted-foreground">
                                Password sign-in stays enabled until Microsoft sign-in is configured, preventing an accidental lockout.
                            </p>
                        )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </ScrollArea>
    );
}
