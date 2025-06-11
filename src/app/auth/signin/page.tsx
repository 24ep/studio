
"use client"; // <-- Add this directive

import { useEffect, useState } from "react"; // <-- Import hooks
import { getServerSession } from "next-auth/next"; // Still needed for server-side redirect check
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AzureAdSignInButton } from "@/components/auth/AzureAdSignInButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Image from 'next/image';
import { CredentialsSignInForm } from "@/components/auth/CredentialsSignInForm";

const APP_LOGO_DATA_URL_KEY = 'appLogoDataUrl'; // Key for localStorage

// This part needs to run server-side or be adapted for client-side if page is fully client
// For now, keeping server-side check for session and redirect if already logged in.
// If full client component, this check would move to a useEffect or similar.
async function getSessionAndRedirect() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/");
  }
}

export default function SignInPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Perform server-side check for session and redirect if necessary
  // This is a bit of a hybrid approach due to Next.js App Router patterns.
  // Ideally, for a fully client component, session checks would also be client-side.
  // However, redirecting from server is cleaner if session exists.
  const [sessionChecked, setSessionChecked] = useState(false);
  useEffect(() => {
    getSessionAndRedirect().finally(() => setSessionChecked(true));
  }, []);


  useEffect(() => {
    setIsClient(true); // Indicate component has mounted client-side
    const storedLogo = localStorage.getItem(APP_LOGO_DATA_URL_KEY);
    if (storedLogo) {
      setAppLogoUrl(storedLogo);
    }
  }, []);

  const isAzureAdConfigured = !!(
    process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID && // Ensure these are NEXT_PUBLIC_ if read client-side
    process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_SECRET &&
    process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID
  ) || !!( // Fallback to non-public for initial check, server has real values
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID
  );


  const error = searchParams?.error;
  let errorMessage = '';
  if (error) {
    if (error === "CredentialsSignin") {
      errorMessage = "Invalid email or password. Please try again.";
    } else if (error === "OAuthSignin" || error === "OAuthCallback" || error === "OAuthCreateAccount" || error === "EmailCreateAccount" || error === "Callback" || error === "OAuthAccountNotLinked" || error === "EmailSignin" || error === "SessionRequired") {
      errorMessage = "There was an error signing in with Azure AD. Please try again or contact support.";
    } else {
      errorMessage = decodeURIComponent(error as string);
    }
  }
  
  if (!sessionChecked && !isClient) {
    // Still performing server-side session check or initial client render, show minimal loading
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4">
        <Card className="w-full max-w-md shadow-2xl opacity-0 animate-fadeIn">
           {/* Basic skeleton while session check completes or client mounts */}
        </Card>
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
              className="mx-auto mb-4 rounded-lg object-contain" // Use rounded-lg for potentially non-square logos
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
