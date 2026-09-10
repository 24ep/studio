import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { AzureAdSignInButton } from '@/components/auth/AzureAdSignInButton';
import { CredentialsSignInForm } from '@/components/auth/CredentialsSignInForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import type { DesktopSignInViewProps } from './DesktopSignInView';

type DesktopSignInViewPartProps = DesktopSignInViewProps & {
  secureLogoUrl: string | null;
};

export function DesktopSignInHero({
  appName,
  loginHeroCopy,
  secureLogoUrl,
}: DesktopSignInViewPartProps) {
  const companyLogoUrl = secureLogoUrl || '/brand/default-company-building.svg';

  return (
    <div className="hidden flex-1 items-center px-12 md:flex lg:px-20">
      <div className="max-w-3xl space-y-8 text-slate-900 dark:text-white">
        <div className="flex h-11 items-center gap-4">
          <span className="relative h-10 w-10 shrink-0 overflow-hidden">
            <Image
              src={companyLogoUrl}
              alt={`${appName} company logo`}
              fill
              unoptimized
              sizes="40px"
              className="object-contain brightness-0 invert"
            />
          </span>
          <span aria-hidden="true" className="h-8 w-px shrink-0 bg-slate-700/50 dark:bg-white/30" />
          <Image
            src="/brand/hrive-wordmark-transparent.png"
            alt="hrive"
            width={145}
            height={44}
            priority
            className="h-9 w-auto object-contain lg:h-10"
          />
        </div>
        <div className="space-y-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-8 motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-600/80 dark:text-white/60">
            {loginHeroCopy.eyebrow}
          </p>
          <h1 className="max-w-2xl text-5xl font-semibold leading-[1.05] tracking-[-0.04em] lg:text-7xl">
            {loginHeroCopy.title || appName}
          </h1>
          <p className="max-w-xl text-lg leading-8 text-slate-700/85 dark:text-white/75 lg:text-xl">
            {loginHeroCopy.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function DesktopSignInMobileBrand({
  appName,
  isClient,
  secureLogoUrl,
}: DesktopSignInViewPartProps) {
  return (
    <div className="block md:hidden py-6 flex items-center justify-start gap-4 px-6 sm:px-10 flex-shrink-0 w-full mb-4">
      {isClient && (
        secureLogoUrl ? (
          <div className="relative h-8 w-20 sm:h-10 sm:w-24">
            <Image
              src={secureLogoUrl}
              alt="App Logo"
              fill
              unoptimized
              sizes="(max-width: 640px) 80px, 96px"
              className="rounded-md object-contain"
            />
          </div>
        ) : (
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-md flex items-center justify-center" style={{ width: '40px', height: '40px' }}>
            <span className="text-sm font-bold text-primary-foreground">CT</span>
          </div>
        )
      )}
      <div>
        <div className="text-xs sm:text-sm uppercase tracking-wide opacity-80 font-medium text-foreground">Welcome to</div>
        <h1 className="text-xl sm:text-3xl font-semibold leading-tight text-foreground">
          {appName}
        </h1>
      </div>
    </div>
  );
}

export function DesktopSignInAuthCard({
  activeBgEnd,
  activeBgStart,
  activeFontColor,
  appName,
  basicAuthEnabled,
  errorMessage,
  isAzureAdConfigured,
  loginPageFooter,
  loginStage,
  onStageChange,
  organizationName,
  showLogoOnly,
}: DesktopSignInViewPartProps) {
  return (
    <Card className="flex w-full flex-col overflow-hidden border border-slate-200/70 bg-white/85 shadow-[0_30px_90px_rgba(15,23,42,0.16)] backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-950/80 md:min-h-[calc(100dvh-3rem)] md:rounded-2xl">
      <CardContent className="flex flex-1 flex-col justify-center space-y-6 overflow-y-auto p-6 sm:p-8 md:px-10">
        {!showLogoOnly && (
          <div className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Sign in</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Continue to {appName}
            </CardDescription>
          </div>
        )}

        {errorMessage && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/50 dark:border-red-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {basicAuthEnabled && (
          <CredentialsSignInForm
            activeFontColor={activeFontColor}
            activeBgStart={activeBgStart}
            activeBgEnd={activeBgEnd}
            onStageChange={onStageChange}
          />
        )}

        {isAzureAdConfigured && loginStage === 'email' && (
          <div className="mt-2">
            {basicAuthEnabled && <DesktopSignInAzureDivider />}
            <AzureAdSignInButton />
          </div>
        )}

        <DesktopSignInPrivacyNotice />

        <DesktopSignInFooter
          loginPageFooter={loginPageFooter}
          organizationName={organizationName}
        />
      </CardContent>
    </Card>
  );
}

function DesktopSignInPrivacyNotice() {
  return (
    <div className="border-t border-slate-200/70 pt-5 text-center dark:border-slate-800/80">
      <p className="mx-auto flex max-w-md items-start justify-center gap-2 text-xs leading-5 text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
        <span>
          Your sign-in is protected. Learn how hrive handles your information in our{' '}
          <Link href="/privacy-support/privacy-policy" className="font-medium text-foreground underline decoration-slate-400 underline-offset-4 hover:text-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/privacy-support/terms" className="font-medium text-foreground underline decoration-slate-400 underline-offset-4 hover:text-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            Terms of Service
          </Link>.
        </span>
      </p>
    </div>
  );
}

function DesktopSignInAzureDivider() {
  return (
    <div className="relative mb-4">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border/50" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
      </div>
    </div>
  );
}

function DesktopSignInFooter({
  loginPageFooter,
  organizationName,
}: Pick<DesktopSignInViewProps, 'loginPageFooter' | 'organizationName'>) {
  if (!loginPageFooter && !organizationName) {
    return null;
  }

  return (
    <div className="mt-4 text-center space-y-1">
      {loginPageFooter && (
        <p className="text-xs text-muted-foreground">
          {loginPageFooter}
        </p>
      )}
      {organizationName && (
        <p className="text-[10px] text-muted-foreground/60">
          &copy; {new Date().getFullYear()} {organizationName}. All rights reserved.
        </p>
      )}
    </div>
  );
}
