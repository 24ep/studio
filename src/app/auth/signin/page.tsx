
"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation"; // Corrected: use "next/navigation" for App Router client-side redirect
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AzureAdSignInButton } from "@/components/auth/AzureAdSignInButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react"; // Added Loader2
import Image from 'next/image';
import { CredentialsSignInForm } from "@/components/auth/CredentialsSignInForm";

const APP_LOGO_DATA_URL_KEY = 'appLogoDataUrl'; // Key for localStorage

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const nextSearchParams = useSearchParams(); // Use the hook here
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const callbackUrl = nextSearchParams.get('callbackUrl') || "/"; // Get callbackUrl using .get()

  useEffect(() => {
    setIsClient(true); // Indicate component has mounted client-side
    const storedLogo = localStorage.getItem(APP_LOGO_DATA_URL_KEY);
    if (storedLogo) {
      setAppLogoUrl(storedLogo);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace(callbackUrl); // Use router.replace for client-side redirect
    }
  }, [session, status, router, callbackUrl]);

  const isAzureAdConfigured = !!(
    process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID &&
    process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_SECRET &&
    process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID
  ) || !!( // Fallback to non-public for initial check if server had real values (though this page is client)
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID
  );

  const errorParam = nextSearchParams.get('error'); // Get error using .get()
  let errorMessage = '';
  if (errorParam) {
    if (errorParam === "CredentialsSignin") {
      errorMessage = "Invalid email or password. Please try again.";
    } else if (errorParam === "OAuthSignin" || errorParam === "OAuthCallback" || errorParam === "OAuthCreateAccount" || errorParam === "EmailCreateAccount" || errorParam === "Callback" || errorParam === "OAuthAccountNotLinked" || errorParam === "EmailSignin" || errorParam === "SessionRequired") {
      errorMessage = "There was an error signing in with Azure AD. Please try again or contact support.";
    } else {
      errorMessage = decodeURIComponent(errorParam as string);
    }
  }

  if (status === "loading" || !isClient) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (status === "authenticated") {
    // This state should be brief as the useEffect above will redirect.
    return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4">
        <p>Redirecting...</p>
        <Loader2 className="h-8 w-8 animate-spin text-primary mt-2" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          {isClient && appLogoUrl && (
            <Image
              src={appLogoUrl}
              alt="Application Logo"
              width={80}
              height={80}
              className="mx-auto mb-4 rounded-lg object-contain"
              data-ai-hint="company logo"
            />
          )}
          <CardTitle className="text-3xl font-bold tracking-tight">
            Welcome to<br />CandiTrack
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to manage your recruitment pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Login Failed</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <CredentialsSignInForm />

          {isAzureAdConfigured && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <AzureAdSignInButton />
            </>
          )}
           {!isAzureAdConfigured && !errorMessage && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>SSO Not Configured</AlertTitle>
              <AlertDescription>
                Single Sign-On (Azure AD) is not currently configured.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} CandiTrack. All rights reserved.
      </footer>
    </div>
  );
}
