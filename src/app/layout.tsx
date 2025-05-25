
import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from "@/components/ui/toaster";


const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CandiTrack - Applicant Tracking System',
  description: 'Streamline your hiring process with CandiTrack.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${openSans.variable} font-sans antialiased`}>
        <AppLayout>
          {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
