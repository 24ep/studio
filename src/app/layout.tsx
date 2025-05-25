
import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/components/auth/AuthProvider';
// If you need to pass server-side session for initial render optimization:
// import { getServerSession } from "next-auth/next"
// import { authOptions } from "@/app/api/auth/[...nextauth]/route"


const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CandiTrack - Applicant Tracking System',
  description: 'Streamline your hiring process with CandiTrack.',
};

export default async function RootLayout({ // Note: 'async' if using getServerSession
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // To pass server-side session to SessionProvider for faster initial loads (optional):
  // const session = await getServerSession(authOptions); 

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${openSans.variable} font-sans antialiased`}>
        <AuthProvider> {/* Pass session={session} if using getServerSession */}
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
