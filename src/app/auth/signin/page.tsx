
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AzureAdSignInButton } from "@/components/auth/AzureAdSignInButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, LogIn, KeyRound } from "lucide-react";
import Image from 'next/image';
import { Separator } from "@/components/ui/separator";
import { CredentialsSignInForm } from "@/components/auth/CredentialsSignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/"); // Redirect to dashboard if already signed in
  }

  const isAzureAdConfigured = !!(
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID
  );

  const error = searchParams?.error;
  let errorMessage = '';
  if (error) {
    // Common NextAuth errors, you can customize these
    if (error === "CredentialsSignin") {
      errorMessage = "Invalid email or password. Please try again.";
    } else if (error === "OAuthSignin" || error === "OAuthCallback" || error === "OAuthCreateAccount" || error === "EmailCreateAccount" || error === "Callback" || error === "OAuthAccountNotLinked" || error === "EmailSignin" || error === "SessionRequired") {
      errorMessage = "There was an error signing in with Azure AD. Please try again or contact support.";
    } else {
      // For custom errors thrown in authorize function
      errorMessage = decodeURIComponent(error as string);
    }
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <Image 
            src="/_next/image?url=https%3A%2F%2Fplacehold.co%2F100x100.png&w=128&q=75" // Placeholder logo
            alt="Candidate Matching Logo"
            width={80}
            height={80}
            className="mx-auto mb-4 rounded-full"
            data-ai-hint="company logo"
          />
          <CardTitle className="text-3xl font-bold tracking-tight">
            Welcome to<br />Candidate Matching
          </CardTitle>
          <CardDescription className="text-muted-foreground">
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
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <AzureAdSignInButton />
            </>
          )}
           {!isAzureAdConfigured && !errorMessage && ( // Show this only if Azure is not configured AND there's no other login error
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>SSO Not Configured</AlertTitle>
              <AlertDescription>
                Single Sign-On (Azure AD) is not currently configured for this application.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Candidate Matching. All rights reserved.
      </footer>
    </div>
  );
}

    