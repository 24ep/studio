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
import type { SystemSetting, LoginPageBackgroundType, LoginPageLayoutType } from '@/lib/types';
import { setThemeAndColors } from '@/lib/themeUtils';
import { sanitizeHtml } from '@/lib/utils';

interface SignInClientProps {
  initialSettings?: SystemSetting[];
}

const APP_LOGO_DATA_URL_KEY = 'appLogoDataUrl';
const APP_CONFIG_APP_NAME_KEY = 'appConfigAppName';
const DEFAULT_APP_NAME = "CandiTrack";
const DEFAULT_LOGIN_BG_GRADIENT = "linear-gradient(90deg, rgba(255, 255, 255, 1) 0%, rgba(245, 245, 255, 1) 100%, rgba(252, 252, 255, 1) 55%)";
const DEFAULT_LOGIN_BG_GRADIENT_DARK = "linear-gradient(90deg, hsl(220, 15%, 9%) 0%, hsl(220, 15%, 11%) 100%, hsl(220, 15%, 10%) 55%)";
const DEFAULT_PRIMARY_GRADIENT_START_SIGNIN = "179 67% 66%";
const DEFAULT_PRIMARY_GRADIENT_END_SIGNIN = "238 74% 61%";
const DEFAULT_LOGIN_LAYOUT_TYPE: LoginPageLayoutType = 'center';

// Login background settings keys
const LOGIN_BACKGROUND_TYPE_KEY = 'loginPageBackgroundType';
const LOGIN_BACKGROUND_IMAGE_KEY = 'loginPageBackgroundImageUrl';
const LOGIN_BACKGROUND_GRADIENT_START_KEY = 'loginPageBackgroundColor1';
const LOGIN_BACKGROUND_GRADIENT_END_KEY = 'loginPageBackgroundColor2';
const LOGIN_BACKGROUND_COLOR_KEY = 'loginPageBackgroundColor1';

export default function SignInClient({ initialSettings }: SignInClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const nextSearchParams = useSearchParams();
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(() => {
    if (initialSettings) {
      return initialSettings.find(s => s.key === 'appLogoDataUrl')?.value || null;
    }
    return null;
  });
  const [currentAppName, setCurrentAppName] = useState<string>(() => {
    if (initialSettings) {
      return initialSettings.find(s => s.key === 'appName')?.value || DEFAULT_APP_NAME;
    }
    return DEFAULT_APP_NAME;
  });
  const [isClient, setIsClient] = useState(false);
  const [loginPageStyle, setLoginPageStyle] = useState<React.CSSProperties>({});
  const [isThemeDark, setIsThemeDark] = useState(false);
  const [loginLayoutType, setLoginLayoutType] = useState<LoginPageLayoutType>(() => {
    if (initialSettings) {
      return (initialSettings.find(s => s.key === 'loginPageLayoutType')?.value as LoginPageLayoutType) || DEFAULT_LOGIN_LAYOUT_TYPE;
    }
    return DEFAULT_LOGIN_LAYOUT_TYPE;
  });

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

    // If no initialSettings, fetch on client as fallback
    if (!initialSettings) {
      const fetchAppAndLoginConfig = async () => {
        let appName = DEFAULT_APP_NAME;
        let logoUrl = null;
        let loginBgType: LoginPageBackgroundType = 'gradient';
        let loginBgImageUrl: string | null = null;
        let loginBgColor1: string | null = null;
        let loginBgColor2: string | null = null;
        let primaryStart = DEFAULT_PRIMARY_GRADIENT_START_SIGNIN;
        let primaryEnd = DEFAULT_PRIMARY_GRADIENT_END_SIGNIN;
        let loginLayoutTypeSetting: LoginPageLayoutType = DEFAULT_LOGIN_LAYOUT_TYPE;

        try {
          const response = await fetch('/api/settings/system-settings');
          if (response.ok) {
            const settings = await response.json();
            appName = settings.appName || DEFAULT_APP_NAME;
            logoUrl = settings.appLogoDataUrl || null;
            loginBgType = settings[LOGIN_BACKGROUND_TYPE_KEY] as LoginPageBackgroundType || 'gradient';
            loginBgImageUrl = settings[LOGIN_BACKGROUND_IMAGE_KEY] || null;
            loginBgColor1 = settings[LOGIN_BACKGROUND_GRADIENT_START_KEY] || null;
            loginBgColor2 = settings[LOGIN_BACKGROUND_GRADIENT_END_KEY] || null;
            loginLayoutTypeSetting = settings.loginPageLayoutType as LoginPageLayoutType || DEFAULT_LOGIN_LAYOUT_TYPE;
            primaryStart = settings.primaryGradientStart || DEFAULT_PRIMARY_GRADIENT_START_SIGNIN;
            primaryEnd = settings.primaryGradientEnd || DEFAULT_PRIMARY_GRADIENT_END_SIGNIN;

            setCurrentAppName(appName);
            setAppLogoUrl(logoUrl);
            setLoginLayoutType(loginLayoutTypeSetting);

            // Apply primary colors and theme dynamically for login page
            if (typeof document !== 'undefined') {
              const themePref = (settings.appThemePreference as 'system' | 'light' | 'dark') || 'system';
              setThemeAndColors({
                themePreference: themePref,
                primaryGradientStart: primaryStart,
                primaryGradientEnd: primaryEnd,
              });
            }
          }
        } catch (error) {
          console.warn("Failed to fetch system settings for login page, using defaults/localStorage.", error);
          // Fallback to localStorage for app name/logo if API fails
          appName = localStorage.getItem(APP_CONFIG_APP_NAME_KEY) || DEFAULT_APP_NAME;
          logoUrl = localStorage.getItem(APP_LOGO_DATA_URL_KEY) || null;
        }
        
        // Determine login page style
        const newStyle: React.CSSProperties = {
          minHeight: '100vh',
          display: 'flex',
          flexDirection: loginLayoutTypeSetting === '2column' ? 'row' : 'column',
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
          newStyle.backgroundColor = `hsl(${loginBgColor1})`;
        } else if (loginBgType === 'gradient' && loginBgColor1 && loginBgColor2) {
          newStyle.backgroundImage = `linear-gradient(135deg, hsl(${loginBgColor1}), hsl(${loginBgColor2}))`;
        } else { // Default
          newStyle.backgroundImage = isThemeDark ? DEFAULT_LOGIN_BG_GRADIENT_DARK : DEFAULT_LOGIN_BG_GRADIENT;
        }
        setLoginPageStyle(newStyle);
      };
      fetchAppAndLoginConfig();

      const handleAppConfigChange = (event: Event) => {
        fetchAppAndLoginConfig();
      };
      window.addEventListener('appConfigChanged', handleAppConfigChange);

      return () => {
        observer.disconnect();
        window.removeEventListener('appConfigChanged', handleAppConfigChange);
      };
    }
    // If initialSettings are present, set up style from them
    else {
      let loginBgType: LoginPageBackgroundType = initialSettings.find(s => s.key === LOGIN_BACKGROUND_TYPE_KEY)?.value as LoginPageBackgroundType || 'gradient';
      let loginBgImageUrl: string | null = initialSettings.find(s => s.key === LOGIN_BACKGROUND_IMAGE_KEY)?.value || null;
      let loginBgColor1: string | null = initialSettings.find(s => s.key === LOGIN_BACKGROUND_GRADIENT_START_KEY)?.value || null;
      let loginBgColor2: string | null = initialSettings.find(s => s.key === LOGIN_BACKGROUND_GRADIENT_END_KEY)?.value || null;
      let loginLayoutTypeSetting: LoginPageLayoutType = (initialSettings.find(s => s.key === 'loginPageLayoutType')?.value as LoginPageLayoutType) || DEFAULT_LOGIN_LAYOUT_TYPE;
      // Set style
      const newStyle: React.CSSProperties = {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: loginLayoutTypeSetting === '2column' ? 'row' : 'column',
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
        newStyle.backgroundColor = `hsl(${loginBgColor1})`;
      } else if (loginBgType === 'gradient' && loginBgColor1 && loginBgColor2) {
        newStyle.backgroundImage = `linear-gradient(135deg, hsl(${loginBgColor1}), hsl(${loginBgColor2}))`;
      } else {
        newStyle.backgroundImage = isThemeDark ? DEFAULT_LOGIN_BG_GRADIENT_DARK : DEFAULT_LOGIN_BG_GRADIENT;
      }
      setLoginPageStyle(newStyle);
      // Set theme/colors
      let primaryStart = initialSettings.find(s => s.key === 'primaryGradientStart')?.value || DEFAULT_PRIMARY_GRADIENT_START_SIGNIN;
      let primaryEnd = initialSettings.find(s => s.key === 'primaryGradientEnd')?.value || DEFAULT_PRIMARY_GRADIENT_END_SIGNIN;
      const themePref = (initialSettings.find((s: SystemSetting) => s.key === 'appThemePreference')?.value as 'system' | 'light' | 'dark') || 'system';
      setThemeAndColors({
        themePreference: themePref,
        primaryGradientStart: primaryStart,
        primaryGradientEnd: primaryEnd,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isThemeDark, initialSettings]);

  // Set browser tab title to currentAppName
  useEffect(() => {
    if (typeof document !== 'undefined' && currentAppName) {
      document.title = currentAppName;
    }
  }, [currentAppName]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace(callbackUrl);
    }
  }, [session, status, router, callbackUrl]);

  // For the client-side check to show the Azure AD button, we only need to know if Azure AD
  // integration is intended. The presence of NEXT_PUBLIC_AZURE_AD_CLIENT_ID and NEXT_PUBLIC_AZURE_AD_TENANT_ID
  // is sufficient for this hint. The actual secret is only used server-side by NextAuth.js.
  const isAzureAdClientSideHintConfigured = !!(
    process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID &&
    process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID
  );
  
  // The server-side check (if the process.env are available during build for SSG/SSR of this page)
  // uses the actual server-side environment variables.
  const isAzureAdServerSideConfigured = !!(
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET && // Server-side only, fine to check here
    process.env.AZURE_AD_TENANT_ID
  );

  // Show button if either client-side hint OR server-side actual config is present.
  const isAzureAdConfigured = isAzureAdClientSideHintConfigured || isAzureAdServerSideConfigured;


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

  // Extract loginPageContent from settings
  const loginPageContent = initialSettings?.find(s => s.key === 'loginPageContent')?.value || '';

  // Listen for appConfigChanged and force re-render
  useEffect(() => {
    const handleAppConfigChange = () => {
      // Just force a re-render by updating a dummy state
      setAppLogoUrl(prev => prev ? prev + '' : prev);
      setLoginLayoutType(prev => prev ? prev : DEFAULT_LOGIN_LAYOUT_TYPE);
      // Optionally, you can refetch settings or reload the page if needed
    };
    window.addEventListener('appConfigChanged', handleAppConfigChange);
    return () => window.removeEventListener('appConfigChanged', handleAppConfigChange);
  }, []);

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

  // Render login form based on layout type
  const renderLoginForm = () => (
    <Card className="w-full max-w-md bg-card dark:bg-card border border-border shadow-2xl">
      <CardHeader className="flex flex-col items-center justify-center text-center">
        {isClient && appLogoUrl && (
          <Image
            src={appLogoUrl}
            alt="Application Logo"
            width={80}
            height={80}
            className="rounded-md mb-2"
          />
        )}
        <CardTitle className="mt-0 text-2xl font-bold">{currentAppName}</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        {isAzureAdConfigured && <AzureAdSignInButton />}
        <CredentialsSignInForm />
      </CardContent>
    </Card>
  );

  if (loginLayoutType === '2column') {
    return (
      <div style={loginPageStyle} className="min-h-screen flex flex-row">
        {/* Left column: Background only (60%) */}
        <div className="hidden lg:flex flex-col items-center justify-center relative basis-[60%] max-w-[60%]">
          {/* Background is handled by loginPageStyle */}
        </div>

        {/* Right column: Login panel (40%) */}
        <div className="w-full lg:basis-[40%] lg:max-w-[40%] border border-border rounded-lg flex flex-col justify-center items-center bg-background shadow-2xl p-8 lg:p-12">
          <div className="w-full max-w-md">
            {loginPageContent && (
              <div className="mb-8 text-center" dangerouslySetInnerHTML={{ __html: sanitizeHtml(loginPageContent) }} />
            )}
            
            {/* Application Logo and Name */}
            <div className="text-center mb-8">
              {isClient && appLogoUrl ? (
                <Image
                  src={appLogoUrl}
                  alt="Application Logo"
                  width={80}
                  height={80}
                  className="rounded-xl shadow-lg mx-auto mb-4 feature-icon"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg mx-auto mb-4 flex items-center justify-center feature-icon">
                  <span className="text-2xl font-bold text-primary-foreground">CT</span>
                </div>
              )}
              <h2 className="text-2xl font-bold text-foreground">{currentAppName}</h2>
            </div>

            <Card className="w-full bg-white border border-border/50 pro-card-shadow login-transition">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-foreground">Welcome back</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Sign in to your account to continue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {errorMessage && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/50 dark:border-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Authentication Error</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
                
                {isAzureAdConfigured && (
                  <div className="space-y-4">
                    <AzureAdSignInButton />
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/50" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <CredentialsSignInForm />
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: center box layout
  return (
    <div style={loginPageStyle} className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {loginPageContent && (
          <div className="mb-8 text-center" dangerouslySetInnerHTML={{ __html: sanitizeHtml(loginPageContent) }} />
        )}
        
        {/* Logo and Brand */}
        <div className="text-center mb-8 login-transition">
          {isClient && appLogoUrl ? (
            <Image
              src={appLogoUrl}
              alt="Application Logo"
              width={100}
              height={100}
              className="rounded-2xl shadow-lg mx-auto mb-6 feature-icon"
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg mx-auto mb-6 flex items-center justify-center feature-icon">
              <span className="text-3xl font-bold text-primary-foreground">CT</span>
            </div>
          )}
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-2">
            {currentAppName}
          </h1>
          <p className="text-lg text-muted-foreground">
            Professional Recruitment Management
          </p>
        </div>

        <Card className="w-full bg-card/50 backdrop-blur-sm border border-border/50 pro-card-shadow login-transition">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-foreground">Welcome back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {errorMessage && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/50 dark:border-red-800">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            {isAzureAdConfigured && (
              <div className="space-y-4">
                <AzureAdSignInButton />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card/50 px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
              </div>
            )}
            
            <CredentialsSignInForm />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
} 