import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
// import { Open_Sans, Roboto, Inter, Montserrat, Lato, Nunito, Source_Sans_3, Raleway, Ubuntu, Quicksand, PT_Sans } from 'next/font/google';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
// If you need to pass server-side session for initial render optimization:
// import { getServerSession } from "next-auth/next"
// import { authOptions } from "@/app/api/auth/[...nextauth]/route"



const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export async function generateMetadata(): Promise<Metadata> {
  // Remove build-time database calls
  const defaultTitle = "CandiTrack - Recruitment Management System";
  const defaultDescription = "Comprehensive recruitment management system for tracking candidates, positions, and hiring processes.";
  
  return {
    title: {
      default: defaultTitle,
      template: '%s | CandiTrack'
    },
    description: defaultDescription,
    keywords: ['recruitment', 'hiring', 'candidates', 'positions', 'HR'],
    authors: [{ name: 'CandiTrack Team' }],
    creator: 'CandiTrack',
    publisher: 'CandiTrack',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:9846'),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: '/',
      title: defaultTitle,
      description: defaultDescription,
      siteName: 'CandiTrack',
    },
    twitter: {
      card: 'summary_large_image',
      title: defaultTitle,
      description: defaultDescription,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {


  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <TooltipProvider>
          <AuthProvider>
            <ErrorBoundary>
              <AppLayout>
                {children}
              </AppLayout>
            </ErrorBoundary>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                },
              }}
            />
          </AuthProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}

    