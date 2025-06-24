"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AzureAdSignInButton } from "@/components/auth/AzureAdSignInButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import Image from 'next/image';
import { CredentialsSignInForm } from "@/components/auth/CredentialsSignInForm";
import { setThemeAndColors } from '@/lib/themeUtils';
const APP_LOGO_DATA_URL_KEY = 'appLogoDataUrl';
const APP_CONFIG_APP_NAME_KEY = 'appConfigAppName';
const DEFAULT_APP_NAME = "CandiTrack";
const DEFAULT_LOGIN_BG_GRADIENT = "linear-gradient(90deg, rgba(255, 255, 255, 1) 0%, rgba(245, 245, 255, 1) 100%, rgba(252, 252, 255, 1) 55%)";
const DEFAULT_LOGIN_BG_GRADIENT_DARK = "linear-gradient(90deg, hsl(220, 15%, 9%) 0%, hsl(220, 15%, 11%) 100%, hsl(220, 15%, 10%) 55%)";
const DEFAULT_PRIMARY_GRADIENT_START_SIGNIN = "179 67% 66%";
const DEFAULT_PRIMARY_GRADIENT_END_SIGNIN = "238 74% 61%";
const DEFAULT_LOGIN_LAYOUT_TYPE = 'center';
export default function SignInClient({ initialSettings }) {
    var _a;
    const { data: session, status } = useSession();
    const router = useRouter();
    const nextSearchParams = useSearchParams();
    const [appLogoUrl, setAppLogoUrl] = useState(() => {
        var _a;
        if (initialSettings) {
            return ((_a = initialSettings.find(s => s.key === 'appLogoDataUrl')) === null || _a === void 0 ? void 0 : _a.value) || null;
        }
        return null;
    });
    const [currentAppName, setCurrentAppName] = useState(() => {
        var _a;
        if (initialSettings) {
            return ((_a = initialSettings.find(s => s.key === 'appName')) === null || _a === void 0 ? void 0 : _a.value) || DEFAULT_APP_NAME;
        }
        return DEFAULT_APP_NAME;
    });
    const [isClient, setIsClient] = useState(false);
    const [loginPageStyle, setLoginPageStyle] = useState({});
    const [isThemeDark, setIsThemeDark] = useState(false);
    const [loginLayoutType, setLoginLayoutType] = useState(() => {
        var _a;
        if (initialSettings) {
            return ((_a = initialSettings.find(s => s.key === 'loginPageLayoutType')) === null || _a === void 0 ? void 0 : _a.value) || DEFAULT_LOGIN_LAYOUT_TYPE;
        }
        return DEFAULT_LOGIN_LAYOUT_TYPE;
    });
    const callbackUrl = nextSearchParams.get('callbackUrl') || "/";
    useEffect(() => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
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
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                let appName = DEFAULT_APP_NAME;
                let logoUrl = null;
                let loginBgType = 'default';
                let loginBgImageUrl = null;
                let loginBgColor1 = null;
                let loginBgColor2 = null;
                let primaryStart = DEFAULT_PRIMARY_GRADIENT_START_SIGNIN;
                let primaryEnd = DEFAULT_PRIMARY_GRADIENT_END_SIGNIN;
                let loginLayoutTypeSetting = DEFAULT_LOGIN_LAYOUT_TYPE;
                try {
                    const response = await fetch('/api/settings/system-settings');
                    if (response.ok) {
                        const settings = await response.json();
                        appName = ((_a = settings.find(s => s.key === 'appName')) === null || _a === void 0 ? void 0 : _a.value) || DEFAULT_APP_NAME;
                        logoUrl = ((_b = settings.find(s => s.key === 'appLogoDataUrl')) === null || _b === void 0 ? void 0 : _b.value) || null;
                        loginBgType = ((_c = settings.find(s => s.key === 'loginPageBackgroundType')) === null || _c === void 0 ? void 0 : _c.value) || 'default';
                        loginBgImageUrl = ((_d = settings.find(s => s.key === 'loginPageBackgroundImageUrl')) === null || _d === void 0 ? void 0 : _d.value) || null;
                        loginBgColor1 = ((_e = settings.find(s => s.key === 'loginPageBackgroundColor1')) === null || _e === void 0 ? void 0 : _e.value) || null;
                        loginBgColor2 = ((_f = settings.find(s => s.key === 'loginPageBackgroundColor2')) === null || _f === void 0 ? void 0 : _f.value) || null;
                        loginLayoutTypeSetting = ((_g = settings.find(s => s.key === 'loginPageLayoutType')) === null || _g === void 0 ? void 0 : _g.value) || DEFAULT_LOGIN_LAYOUT_TYPE;
                        primaryStart = ((_h = settings.find(s => s.key === 'primaryGradientStart')) === null || _h === void 0 ? void 0 : _h.value) || DEFAULT_PRIMARY_GRADIENT_START_SIGNIN;
                        primaryEnd = ((_j = settings.find(s => s.key === 'primaryGradientEnd')) === null || _j === void 0 ? void 0 : _j.value) || DEFAULT_PRIMARY_GRADIENT_END_SIGNIN;
                        setCurrentAppName(appName);
                        setAppLogoUrl(logoUrl);
                        setLoginLayoutType(loginLayoutTypeSetting);
                        // Apply primary colors and theme dynamically for login page
                        if (typeof document !== 'undefined') {
                            const themePref = ((_k = settings.find((s) => s.key === 'appThemePreference')) === null || _k === void 0 ? void 0 : _k.value) || 'system';
                            setThemeAndColors({
                                themePreference: themePref,
                                primaryGradientStart: primaryStart,
                                primaryGradientEnd: primaryEnd,
                            });
                        }
                    }
                }
                catch (error) {
                    console.warn("Failed to fetch system settings for login page, using defaults/localStorage.", error);
                    // Fallback to localStorage for app name/logo if API fails
                    appName = localStorage.getItem(APP_CONFIG_APP_NAME_KEY) || DEFAULT_APP_NAME;
                    logoUrl = localStorage.getItem(APP_LOGO_DATA_URL_KEY) || null;
                }
                // Determine login page style
                const newStyle = {
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
                }
                else if (loginBgType === 'color' && loginBgColor1) {
                    newStyle.backgroundColor = loginBgColor1;
                }
                else if (loginBgType === 'gradient' && loginBgColor1 && loginBgColor2) {
                    newStyle.backgroundImage = `linear-gradient(to right, ${loginBgColor1}, ${loginBgColor2})`;
                }
                else { // Default
                    newStyle.backgroundImage = isThemeDark ? DEFAULT_LOGIN_BG_GRADIENT_DARK : DEFAULT_LOGIN_BG_GRADIENT;
                }
                setLoginPageStyle(newStyle);
            };
            fetchAppAndLoginConfig();
            const handleAppConfigChange = (event) => {
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
            let loginBgType = ((_a = initialSettings.find(s => s.key === 'loginPageBackgroundType')) === null || _a === void 0 ? void 0 : _a.value) || 'default';
            let loginBgImageUrl = ((_b = initialSettings.find(s => s.key === 'loginPageBackgroundImageUrl')) === null || _b === void 0 ? void 0 : _b.value) || null;
            let loginBgColor1 = ((_c = initialSettings.find(s => s.key === 'loginPageBackgroundColor1')) === null || _c === void 0 ? void 0 : _c.value) || null;
            let loginBgColor2 = ((_d = initialSettings.find(s => s.key === 'loginPageBackgroundColor2')) === null || _d === void 0 ? void 0 : _d.value) || null;
            let loginLayoutTypeSetting = ((_e = initialSettings.find(s => s.key === 'loginPageLayoutType')) === null || _e === void 0 ? void 0 : _e.value) || DEFAULT_LOGIN_LAYOUT_TYPE;
            // Set style
            const newStyle = {
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
            }
            else if (loginBgType === 'color' && loginBgColor1) {
                newStyle.backgroundColor = loginBgColor1;
            }
            else if (loginBgType === 'gradient' && loginBgColor1 && loginBgColor2) {
                newStyle.backgroundImage = `linear-gradient(to right, ${loginBgColor1}, ${loginBgColor2})`;
            }
            else {
                newStyle.backgroundImage = isThemeDark ? DEFAULT_LOGIN_BG_GRADIENT_DARK : DEFAULT_LOGIN_BG_GRADIENT;
            }
            setLoginPageStyle(newStyle);
            // Set theme/colors
            let primaryStart = ((_f = initialSettings.find(s => s.key === 'primaryGradientStart')) === null || _f === void 0 ? void 0 : _f.value) || DEFAULT_PRIMARY_GRADIENT_START_SIGNIN;
            let primaryEnd = ((_g = initialSettings.find(s => s.key === 'primaryGradientEnd')) === null || _g === void 0 ? void 0 : _g.value) || DEFAULT_PRIMARY_GRADIENT_END_SIGNIN;
            const themePref = ((_h = initialSettings.find((s) => s.key === 'appThemePreference')) === null || _h === void 0 ? void 0 : _h.value) || 'system';
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
    const isAzureAdClientSideHintConfigured = !!(process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID &&
        process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID);
    // The server-side check (if the process.env are available during build for SSG/SSR of this page)
    // uses the actual server-side environment variables.
    const isAzureAdServerSideConfigured = !!(process.env.AZURE_AD_CLIENT_ID &&
        process.env.AZURE_AD_CLIENT_SECRET && // Server-side only, fine to check here
        process.env.AZURE_AD_TENANT_ID);
    // Show button if either client-side hint OR server-side actual config is present.
    const isAzureAdConfigured = isAzureAdClientSideHintConfigured || isAzureAdServerSideConfigured;
    const errorParam = nextSearchParams.get('error');
    let errorMessage = '';
    if (errorParam) {
        if (errorParam === "CredentialsSignin") {
            errorMessage = "Invalid email or password. Please try again.";
        }
        else if (errorParam === "OAuthSignin" || errorParam === "OAuthCallback" || errorParam === "OAuthCreateAccount" || errorParam === "EmailCreateAccount" || errorParam === "Callback" || errorParam === "OAuthAccountNotLinked" || errorParam === "EmailSignin" || errorParam === "SessionRequired") {
            errorMessage = "There was an error signing in with Azure AD. Please try again or contact support.";
        }
        else {
            errorMessage = decodeURIComponent(errorParam);
        }
    }
    // Extract loginPageContent from settings
    const loginPageContent = ((_a = initialSettings === null || initialSettings === void 0 ? void 0 : initialSettings.find(s => s.key === 'loginPageContent')) === null || _a === void 0 ? void 0 : _a.value) || '';
    if (status === "loading" || !isClient) {
        return (<div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary"/>
      </div>);
    }
    if (status === "authenticated") {
        return (<div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4">
        <p>Redirecting...</p>
        <Loader2 className="h-8 w-8 animate-spin text-primary mt-2"/>
      </div>);
    }
    // Render login form based on layout type
    const renderLoginForm = () => (<Card className="w-full max-w-md bg-card dark:bg-card border border-border shadow-2xl">
      <CardHeader className="flex flex-col items-center justify-center text-center">
        {isClient && appLogoUrl && (<Image src={appLogoUrl} alt="Application Logo" width={80} height={80} className="rounded-md mb-2"/>)}
        <CardTitle className="mt-0 text-2xl font-bold">{currentAppName}</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage && (<Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4"/>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>)}
        {isAzureAdConfigured && <AzureAdSignInButton />}
        <CredentialsSignInForm />
      </CardContent>
    </Card>);
    if (loginLayoutType === '2column') {
        return (<div style={loginPageStyle} className="min-h-screen flex flex-row">
        {/* Left column: Welcome/marketing content (70%) */}
        <div className="hidden md:flex flex-col items-center justify-center relative basis-[70%] max-w-[70%]">
          <div className="text-center text-muted-foreground">
            <h2 className="text-3xl font-bold mb-4">Welcome to {currentAppName}</h2>
            <p className="text-lg">Your comprehensive recruitment management solution</p>
          </div>
        </div>
        {/* Right column: Login panel (30%) */}
        <div className="w-full md:basis-[30%] md:max-w-[30%] flex flex-col justify-center items-center bg-card/80 dark:bg-card/80 border-l border-border shadow-2xl p-8">
          {loginPageContent && (<div style={{ marginBottom: 24 }} dangerouslySetInnerHTML={{ __html: loginPageContent }}/>)}
          {renderLoginForm()}
        </div>
      </div>);
    }
    // Default: center box layout
    return (<div style={loginPageStyle}>
      {loginPageContent && (<div style={{ marginBottom: 24 }} dangerouslySetInnerHTML={{ __html: loginPageContent }}/>)}
      {renderLoginForm()}
    </div>);
}
