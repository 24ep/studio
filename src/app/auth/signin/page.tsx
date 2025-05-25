
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AzureAdSignInButton } from "@/components/auth/AzureAdSignInButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import Image from 'next/image';

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/"); // Redirect to dashboard if already signed in
  }

  const isAzureAdConfigured = !!(
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <Image 
            src="/_next/image?url=https%3A%2F%2Fplacehold.co%2F100x100.png&w=128&q=75" // Placeholder logo
            alt="CandiTrack Logo"
            width={80}
            height={80}
            className="mx-auto mb-4 rounded-full"
            data-ai-hint="company logo"
          />
          <CardTitle className="text-3xl font-bold tracking-tight">Welcome to CandiTrack</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to manage your recruitment pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isAzureAdConfigured ? (
            <>
              <AzureAdSignInButton />
              <Alert className="border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-500">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle className="font-semibold">Azure AD Enabled</AlertTitle>
                <AlertDescription className="text-xs">
                  This application is configured for Azure Active Directory single sign-on.
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>SSO Not Configured</AlertTitle>
              <AlertDescription>
                Single Sign-On (Azure AD) is not currently configured for this application. Please contact your administrator.
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
