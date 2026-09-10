import React from 'react';
import { IBM_Plex_Sans, IBM_Plex_Sans_Thai } from 'next/font/google';
import Script from 'next/script';
import { ClientProviders } from '@/components/providers/ClientProviders';
import './globals.css';
import { FontLoader } from '@/components/ui/FontLoader';
import { FontPreloader } from '@/components/ui/FontPreloader';
import { ResizeObserverInitializer } from '@/components/ui/ResizeObserverInitializer';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { TgInitializationErrorBoundary } from '@/components/ui/TgInitializationErrorBoundary';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { SystemProtectionFeatures } from '@/components/security/SystemProtectionFeatures';
import { themeInitializerScript } from './theme-initializer-script';
import { getSystemSetting } from '@/lib/systemSettings';
import { DEFAULT_APP_NAME } from '@/lib/constants';
import { normalizeAppName } from '@/lib/branding';
import { getValidatedAuthSession } from '@/lib/validated-auth-session';
import type { Metadata } from 'next';

function getMetadataBaseUrl() {
  const configuredUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL;

  if (configuredUrl) {
    try {
      return new URL(configuredUrl);
    } catch (error) {
      console.error('[ROOT LAYOUT] Invalid NEXTAUTH_URL/AUTH_URL:', error);
    }
  }

  return new URL('http://localhost:3000');
}

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-ibm-plex-sans',
  fallback: ['sans-serif'],
  adjustFontFallback: true,
  preload: true,
});

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-ibm-plex-sans-thai',
  fallback: ['sans-serif'],
  adjustFontFallback: true,
  preload: true,
});

export async function generateMetadata(): Promise<Metadata> {
  const appName = normalizeAppName(await getSystemSetting('appName'), DEFAULT_APP_NAME);
  const title = `${appName} - AI-assisted recruitment platform`;
  const description = 'AI-assisted recruitment and applicant management platform';

  return {
    title: { default: title, template: `%s | ${appName}` },
    description,
    keywords: ['recruitment', 'AI', 'applicant management', 'HR', 'hiring'],
    authors: [{ name: appName }],
    creator: appName,
    publisher: appName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: getMetadataBaseUrl(),
    openGraph: {
      title,
      description,
      url: '/',
      siteName: appName,
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        'max-video-preview': -1,
        'max-image-preview': 'none',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
    other: {
      'X-Frame-Options': 'SAMEORIGIN', 'X-XSS-Protection': '1; mode=block',
    },
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const fastDev = process.env.NEXT_PUBLIC_FAST_DEV === 'true';
  const session = fastDev ? null : await getValidatedAuthSession();

  return (
    <html lang="en" suppressHydrationWarning className={`${ibmPlexSans.variable} ${ibmPlexSansThai.variable}`}>
      <head>
        {/* PWA Configuration - Will be conditionally added via PWAMetaTags component in body */}
        {/* Font preloading for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Ramda polyfill is now handled by RamdaPolyfillInitializer component */}
      </head>
      <body>
        <Script id="theme-initializer" strategy="beforeInteractive">
          {themeInitializerScript}
        </Script>
        <TgInitializationErrorBoundary>
          <ErrorBoundary>
            <ResizeObserverInitializer />
            <FontPreloader />
            <FontLoader>
              <ClientProviders session={session}>
                <SystemProtectionFeatures />
                <div id="screen-capture-protected-content" className="h-full w-full">
                  {children}
                </div>
                <MobileBottomNav />
              </ClientProviders>
            </FontLoader>
          </ErrorBoundary>
        </TgInitializationErrorBoundary>
      </body>
    </html>
  );
}
