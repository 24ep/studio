import { AlertTriangle } from "lucide-react";

import { AzureAdSignInButton } from "@/components/auth/AzureAdSignInButton";
import { CredentialsSignInForm } from "@/components/auth/CredentialsSignInForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { sanitizeHtml } from "@/lib/utils";
import {
    shouldShowMobileSignInAzureDivider,
    shouldShowMobileSignInAzureOnly,
} from './mobile-signin-view-utils';

export interface MobileSignInCardProps {
    activeBgEnd: string;
    activeBgStart: string;
    activeFontColor: string;
    basicAuthEnabled: boolean;
    errorMessage: string;
    isAzureAdConfigured: boolean;
    loginPageContent: string;
    loginPageFooter: string;
    loginStage: 'email' | 'otp';
    onStageChange: (stage: 'email' | 'otp') => void;
    organizationName?: string;
}

export function MobileSignInCard({
    activeBgEnd,
    activeBgStart,
    activeFontColor,
    basicAuthEnabled,
    errorMessage,
    isAzureAdConfigured,
    loginPageContent,
    loginPageFooter,
    loginStage,
    onStageChange,
    organizationName,
}: MobileSignInCardProps) {
    return (
        <Card className="flex-1 border-0 shadow-[0_-12px_40px_rgba(0,0,0,0.15)] mt-[-40px] rounded-t-[44px] z-20 relative overflow-hidden bg-card">
            <CardContent className="h-full p-8 overflow-y-auto">
                <div className="w-full max-w-md mx-auto space-y-6">
                    <MobileSignInIntro loginPageContent={loginPageContent} />
                    <MobileSignInError errorMessage={errorMessage} />
                    {basicAuthEnabled && (
                        <CredentialsSignInForm
                            activeFontColor={activeFontColor}
                            activeBgStart={activeBgStart}
                            activeBgEnd={activeBgEnd}
                            onStageChange={onStageChange}
                        />
                    )}
                    <MobileSignInAzureOptions
                        basicAuthEnabled={basicAuthEnabled}
                        isAzureAdConfigured={isAzureAdConfigured}
                        loginStage={loginStage}
                    />
                    <MobileSignInFooter
                        loginPageFooter={loginPageFooter}
                        organizationName={organizationName}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

function MobileSignInIntro({ loginPageContent }: { loginPageContent: string }) {
    return (
        <>
            <div className="space-y-1 mb-2">
                <h2 className="text-2xl font-black tracking-tight text-foreground uppercase leading-none">
                    Sign <span className="text-primary">In</span>
                </h2>
                <p className="text-xs text-muted-foreground font-medium">Please enter your credentials to continue.</p>
            </div>

            {loginPageContent && (
                <div className="mb-2 text-sm text-foreground/70" dangerouslySetInnerHTML={{ __html: sanitizeHtml(loginPageContent) }} />
            )}
        </>
    );
}

function MobileSignInError({ errorMessage }: { errorMessage: string }) {
    if (!errorMessage) {
        return null;
    }

    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
    );
}

function MobileSignInAzureOptions({
    basicAuthEnabled,
    isAzureAdConfigured,
    loginStage,
}: Pick<MobileSignInCardProps, 'basicAuthEnabled' | 'isAzureAdConfigured' | 'loginStage'>) {
    if (shouldShowMobileSignInAzureDivider({ basicAuthEnabled, isAzureAdConfigured, loginStage })) {
        return (
            <div className="mt-4">
                <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card dark:bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>
                <AzureAdSignInButton />
            </div>
        );
    }

    if (shouldShowMobileSignInAzureOnly({ basicAuthEnabled, isAzureAdConfigured, loginStage })) {
        return (
            <div className="mt-4">
                <AzureAdSignInButton />
            </div>
        );
    }

    return null;
}

function MobileSignInFooter({
    loginPageFooter,
    organizationName,
}: Pick<MobileSignInCardProps, 'loginPageFooter' | 'organizationName'>) {
    if (!loginPageFooter && !organizationName) {
        return null;
    }

    return (
        <div className="mt-8 text-center pt-8 space-y-1">
            {loginPageFooter && <p className="text-xs text-muted-foreground">{loginPageFooter}</p>}
            {organizationName && (
                <p className="text-[10px] text-muted-foreground/60">
                    &copy; {new Date().getFullYear()} {organizationName}. All rights reserved.
                </p>
            )}
        </div>
    );
}
