import type { Metadata } from 'next';
import { Poppins, Open_Sans, Roboto, Inter, Montserrat, Lato, Nunito, Source_Sans_3, Raleway, Ubuntu, Quicksand, PT_Sans } from 'next/font/google';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
// If you need to pass server-side session for initial render optimization:
// import { getServerSession } from "next-auth/next"
// import { authOptions } from "@/app/api/auth/[...nextauth]/route"


const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans', display: 'swap' });
const roboto = Roboto({ subsets: ['latin'], variable: '--font-roboto', display: 'swap', weight: ['100', '300', '400', '500', '700', '900'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat', display: 'swap' });
const lato = Lato({ subsets: ['latin'], variable: '--font-lato', display: 'swap', weight: ['100', '300', '400', '700', '900'] });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap' });
const sourceSans3 = Source_Sans_3({ subsets: ['latin'], variable: '--font-source-sans-3', display: 'swap' });
const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway', display: 'swap' });
const ubuntu = Ubuntu({ subsets: ['latin'], variable: '--font-ubuntu', display: 'swap', weight: ['300', '400', '500', '700'] });
const quicksand = Quicksand({ subsets: ['latin'], variable: '--font-quicksand', display: 'swap' });
const ptSans = PT_Sans({ subsets: ['latin'], variable: '--font-pt-sans', display: 'swap', weight: ['400', '700'] });

const DEFAULT_APP_NAME = 'CandiTrack';
const DEFAULT_DESCRIPTION = 'Streamline your hiring process with Candidate Matching.';

export async function generateMetadata(): Promise<Metadata> {
  let appName = DEFAULT_APP_NAME;
  let description = DEFAULT_DESCRIPTION;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const res = await fetch(baseUrl + '/api/settings/system-settings', { cache: 'no-store' });
    if (res.ok) {
      const settings = await res.json();
      const appNameSetting = settings.find((s: any) => s.key === 'appName');
      if (appNameSetting && appNameSetting.value) appName = appNameSetting.value;
      // Optionally, you could add a description setting as well
    }
  } catch {}
  return {
    title: appName,
    description,
  };
}

export default async function RootLayout({ // Note: 'async' if using getServerSession
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // To pass server-side session to SessionProvider for faster initial loads (optional):
  const session = await getServerSession(authOptions); 

  // Fetch system settings for font
  let appFontFamily = 'Poppins';
  try {
    const res = await fetch(process.env.NEXT_PUBLIC_BASE_URL + '/api/settings/system-settings', { cache: 'no-store' });
    if (res.ok) {
      const settings = await res.json();
      const fontSetting = settings.find((s: any) => s.key === 'appFontFamily');
      if (fontSetting && fontSetting.value) appFontFamily = fontSetting.value;
    }
  } catch {}

  let fontVar = poppins.variable;
  if (appFontFamily === 'Open Sans') fontVar = openSans.variable;
  else if (appFontFamily === 'Roboto') fontVar = roboto.variable;
  else if (appFontFamily === 'Inter') fontVar = inter.variable;
  else if (appFontFamily === 'Montserrat') fontVar = montserrat.variable;
  else if (appFontFamily === 'Lato') fontVar = lato.variable;
  else if (appFontFamily === 'Nunito') fontVar = nunito.variable;
  else if (appFontFamily === 'Source Sans 3') fontVar = sourceSans3.variable;
  else if (appFontFamily === 'Raleway') fontVar = raleway.variable;
  else if (appFontFamily === 'Ubuntu') fontVar = ubuntu.variable;
  else if (appFontFamily === 'Quicksand') fontVar = quicksand.variable;
  else if (appFontFamily === 'PT Sans') fontVar = ptSans.variable;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontVar} font-sans antialiased`}>
        <AuthProvider session={session}> {/* Pass session={session} if using getServerSession */}
          <Toaster position="top-center" />
          <AppLayout>
            {children}
          </AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}

    