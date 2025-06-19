
"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AzureAdSignInButton } from "@/components/auth/AzureAdSignInButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import Image from 'next/image';
import { CredentialsSignInForm } from "@/components/auth/CredentialsSignInForm";
import type { SystemSetting, LoginPageBackgroundType } from '@/lib/types';

const APP_LOGO_DATA_URL_KEY = 'appLogoDataUrl';
const APP_CONFIG_APP_NAME_KEY = 'appConfigAppName';
const DEFAULT_APP_NAME = "CandiTrack";
const DEFAULT_LOGIN_BG_GRADIENT = "linear-gradient(90deg, rgba(255, 255, 255, 1) 0%, rgba(245, 245, 255, 1) 100%, rgba(252, 252, 255, 1) 55%)";
const DEFAULT_LOGIN_BG_GRADIENT_DARK = "linear-gradient(90deg, hsl(220, 15%, 9%) 0%, hsl(220, 15%, 11%) 100%, hsl(220, 15%, 10%) 55%)";

// Updated HSL strings for primary gradient, matching globals.css and preferences page
const DEFAULT_PRIMARY_GRADIENT_START_SIGNIN = "179 67% 66%";
const DEFAULT_PRIMARY_GRADIENT_END_SIGNIN = "238 74% 61%";


export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const nextSearchParams = useSearchParams();
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);
  const [currentAppName, setCurrentAppName] = useState<string>(DEFAULT_APP_NAME);
  const [isClient, setIsClient] = useState(false);
  const [loginPageStyle, setLoginPageStyle] = useState<React.CSSProperties>({});
  const [isThemeDark, setIsThemeDark] = useState(false);

  const callbackUrl = nextSearchParams.get('callbackUrl') || "/";

  useEffect(() => {
    setIsClient(true);
    // Function to update theme status
    const updateThemeStatus = () => {
      setIsThemeDark(document.documentElement.classList.contains('dark'));
    };
    updateThemeStatus(); // Initial check

    // Observe theme changes
    const observer = new MutationObserver(updateThemeStatus);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });


    const fetchAppAndLoginConfig = async () => {
      let appName = DEFAULT_APP_NAME;
      let logoUrl = null;
      let loginBgType: LoginPageBackgroundType = 'default';
      let loginBgImageUrl: string | null = null;
      let loginBgColor1: string | null = null;
      let loginBgColor2: string | null = null;
      let primaryStart = DEFAULT_PRIMARY_GRADIENT_START_SIGNIN;
      let primaryEnd = DEFAULT_PRIMARY_GRADIENT_END_SIGNIN;


      try {
        const response = await fetch('/api/settings/system-settings');
        if (response.ok) {
          const settings: SystemSetting[] = await response.json();
          appName = settings.find(s => s.key === 'appName')?.value || DEFAULT_APP_NAME;
          logoUrl = settings.find(s => s.key === 'appLogoDataUrl')?.value || null;
          loginBgType = settings.find(s => s.key === 'loginPageBackgroundType')?.value as LoginPageBackgroundType || 'default';
          loginBgImageUrl = settings.find(s => s.key === 'loginPageBackgroundImageUrl')?.value || null;
          loginBgColor1 = settings.find(s => s.key === 'loginPageBackgroundColor1')?.value || null;
          loginBgColor2 = settings.find(s => s.key === 'loginPageBackgroundColor2')?.value || null;
          
          primaryStart = settings.find(s => s.key === 'primaryGradientStart')?.value || DEFAULT_PRIMARY_GRADIENT_START_SIGNIN;
          primaryEnd = settings.find(s => s.key === 'primaryGradientEnd')?.value || DEFAULT_PRIMARY_GRADIENT_END_SIGNIN;

        }
      } catch (error) {
        console.warn("Failed to fetch system settings for login page, using defaults/localStorage.", error);
        // Fallback to localStorage for app name/logo if API fails
        appName = localStorage.getItem(APP_CONFIG_APP_NAME_KEY) || DEFAULT_APP_NAME;
        logoUrl = localStorage.getItem(APP_LOGO_DATA_URL_KEY) || null;
      }
      
      setCurrentAppName(appName);
      setAppLogoUrl(logoUrl);

      // Apply primary colors dynamically for login page
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--primary-gradient-start-l', primaryStart);
        document.documentElement.style.setProperty('--primary-gradient-end-l', primaryEnd);
        document.documentElement.style.setProperty('--primary-gradient-start-d', primaryStart); 
        document.documentElement.style.setProperty('--primary-gradient-end-d', primaryEnd);
        document.documentElement.style.setProperty('--primary', `hsl(${primaryStart})`);
      }


      // Determine login page style
      const newStyle: React.CSSProperties = {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        transition: 'background 0.5s ease-in-out',
      };

      if (loginBgType === 'image' && loginBgImageUrl) {
        newStyle.backgroundImage = `url(${loginBgImageUrl})`;
        newStyle.backgroundSize = 'cover';
        newStyle.backgroundPosition = 'center';
        newStyle.backgroundRepeat = 'no-repeat';
      } else if (loginBgType === 'color' && loginBgColor1) {
        newStyle.backgroundColor = loginBgColor1;
      } else if (loginBgType === 'gradient' && loginBgColor1 && loginBgColor2) {
        newStyle.backgroundImage = `linear-gradient(to right, ${loginBgColor1}, ${loginBgColor2})`;
      } else { // Default
        newStyle.backgroundImage = isThemeDark ? DEFAULT_LOGIN_BG_GRADIENT_DARK : DEFAULT_LOGIN_BG_GRADIENT;
      }
      setLoginPageStyle(newStyle);
    };
    
    fetchAppAndLoginConfig();

    const handleAppConfigChange = (event: Event) => {
        // Re-fetch all configurations to ensure login page also picks up primary color changes.
        fetchAppAndLoginConfig();
    };
    window.addEventListener('appConfigChanged', handleAppConfigChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('appConfigChanged', handleAppConfigChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isThemeDark]); // Added isThemeDark dependency to re-evaluate default background

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace(callbackUrl);
    }
  }, [session, status, router, callbackUrl]);

  const isAzureAdConfigured = !!(
    process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID &&
    process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_SECRET &&
    process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID
  ) || !!(
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID
  );

  const errorParam = nextSearchParams.get('error');
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
    return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4">
        <p>Redirecting...</p>
        <Loader2 className="h-8 w-8 animate-spin text-primary mt-2" />
      </div>
    );
  }

  return (
    <div style={loginPageStyle}>
      <Card className="w-full max-w-md bg-card/70 dark:bg-slate-800/20 backdrop-blur-lg border border-white/20 dark:border-slate-700/30 shadow-2xl">
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
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground dark:text-white">
            Welcome to<br />{currentAppName}
          </CardTitle>
          <CardDescription className="text-muted-foreground dark:text-slate-300">
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
                  <span className="w-full border-t border-white/30 dark:border-slate-600/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent px-2 text-muted-foreground dark:text-slate-400">
                    Or continue with
                  </span>
                </div>
              </div>
              <AzureAdSignInButton />
            </>
          )}
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground dark:text-slate-400">
        © {new Date().getFullYear()} {currentAppName}. All rights reserved.
      </footer>
    </div>
  );
}
    

    

