import { Poppins } from 'next/font/google';
// import { Open_Sans, Roboto, Inter, Montserrat, Lato, Nunito, Source_Sans_3, Raleway, Ubuntu, Quicksand, PT_Sans } from 'next/font/google';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
// If you need to pass server-side session for initial render optimization:
// import { getServerSession } from "next-auth/next"
// import { authOptions } from "@/app/api/auth/[...nextauth]/route"
console.log(">>> [BUILD] src/app/layout.tsx loaded");
export const dynamic = "force-dynamic";
const poppins = Poppins({
    subsets: ['latin'],
    variable: '--font-poppins',
    display: 'swap',
    weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});
const DEFAULT_APP_NAME = 'CandiTrack';
const DEFAULT_DESCRIPTION = 'Streamline your hiring process with Candidate Matching.';
export async function generateMetadata() {
    let appName = DEFAULT_APP_NAME;
    let description = DEFAULT_DESCRIPTION;
    try {
        console.log("[BUILD LOG] Before fetch system-settings in generateMetadata");
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        const res = await fetch(baseUrl + '/api/settings/system-settings', { cache: 'no-store' });
        console.log("[BUILD LOG] After fetch system-settings in generateMetadata");
        if (res.ok) {
            const settings = await res.json();
            const appNameSetting = settings.find((s) => s.key === 'appName');
            if (appNameSetting && appNameSetting.value)
                appName = appNameSetting.value;
            // Optionally, you could add a description setting as well
        }
    }
    catch { }
    return {
        title: appName,
        description,
    };
}
export default async function RootLayout({ // Note: 'async' if using getServerSession
children, }) {
    console.log(">>> [BUILD] RootLayout function called");
    console.log("[BUILD LOG] Before getServerSession in RootLayout");
    const session = await getServerSession(authOptions);
    console.log("[BUILD LOG] After getServerSession in RootLayout");
    // Only use Poppins font
    let fontVar = poppins.variable;
    return (<html lang="en" suppressHydrationWarning>
      <body className={`${fontVar} font-sans antialiased`}>
        <AuthProvider session={session}> {/* Pass session={session} if using getServerSession */}
          <Toaster position="top-center"/>
          <AppLayout>
            {children}
          </AppLayout>
        </AuthProvider>
      </body>
    </html>);
}
