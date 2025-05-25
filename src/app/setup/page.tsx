
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { CheckCircle, Settings, AlertTriangle, UserPlus, Database, HardDrive, HelpCircle, RefreshCw, Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AddUserModal, type AddUserFormValues } from "@/components/users/AddUserModal";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function SetupPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  const [dbCheckStatus, setDbCheckStatus] = useState<'idle' | 'loading' | 'ok' | 'partial' | 'error'>('idle');
  const [dbCheckMessage, setDbCheckMessage] = useState<string | null>(null);
  const [missingTables, setMissingTables] = useState<string[]>([]);


  useEffect(() => {
    setIsClient(true);
  }, []);

  const isAdmin = session?.user?.role === 'Admin';

  const handleAddUserSubmit = async (data: AddUserFormValues) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add user and parse error response.' }));
        toast({
          title: "Error Creating User",
          description: errorData.message || 'An unknown error occurred while adding the user.',
          variant: "destructive",
        });
        return;
      }
      const newUser = await response.json();
      toast({ title: "Success", description: `User ${newUser.name} added successfully.` });
      setIsAddUserModalOpen(false);
    } catch (error) {
      console.error("Error adding user:", error);
      toast({ title: "Error Adding User", description: (error as Error).message || "An unexpected error occurred.", variant: "destructive" });
    }
  };

  const handleCheckDbSchema = async () => {
    setDbCheckStatus('loading');
    setDbCheckMessage(null);
    setMissingTables([]);
    try {
      const response = await fetch('/api/setup/check-db-schema');
      const result = await response.json();

      if (!response.ok) {
        setDbCheckStatus('error');
        setDbCheckMessage(result.message || `API Error: ${response.statusText || response.status}`);
        return;
      }

      setDbCheckStatus(result.status as 'ok' | 'partial' | 'error');
      setDbCheckMessage(result.message);
      if (result.missingTables) {
        setMissingTables(result.missingTables);
      }

    } catch (error) {
      console.error("Error checking DB schema:", error);
      setDbCheckStatus('error');
      setDbCheckMessage("Failed to connect to the schema check API. Ensure the application is running correctly.");
    }
  };

  const handleConfirmSetup = () => {
    if (dbCheckStatus !== 'ok') {
        toast({
            title: "Database Schema Not Verified",
            description: "Please ensure the database schema is 'OK' before proceeding. Run the check if you haven't.",
            variant: "destructive",
        });
        return;
    }
    localStorage.setItem('setupComplete', 'true');
    toast({
        title: "Setup Confirmed!",
        description: "Redirecting to login page...",
    });
    router.push('/auth/signin');
  };

  const renderCreateAdminUserSection = () => {
    if (!isClient || sessionStatus === 'loading') {
      return <Button variant="outline" size="sm" disabled className="animate-pulse w-48 h-9">Loading...</Button>;
    }
    if (!session) {
      return (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Please sign in to manage users.</p>
          <Button onClick={() => signIn()} variant="outline" size="sm">Sign In</Button>
        </div>
      );
    }
    if (!isAdmin) {
      return (
        <div>
          <Button variant="outline" size="sm" disabled>
            <UserPlus className="mr-2 h-4 w-4" /> Create Admin User
          </Button>
          <p className="text-xs text-muted-foreground mt-1">You must be logged in as an Admin to perform this action.</p>
        </div>
      );
    }
    return (
      <Button variant="outline" size="sm" onClick={() => setIsAddUserModalOpen(true)} className="btn-hover-primary-gradient">
        <UserPlus className="mr-2 h-4 w-4" /> Create Admin User
      </Button>
    );
  };


  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Settings className="mr-3 h-7 w-7 text-primary" />
            Application Setup Guide
          </CardTitle>
          <CardDescription>
            Follow these steps for initial application setup and configuration. Many steps are automated with Docker.
            Once setup is verified, proceed to login.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">

          <section className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg text-foreground mb-2 flex items-center"><Database className="mr-3 h-5 w-5 text-primary shrink-0" />1. Database Schema Status</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground flex-1">
                Verify if essential database tables (e.g., "User", "Candidate", "Position") have been created.
                These should be automatically created by scripts in <code>pg-init-scripts/</code> (like <code>init-db.sql</code>) when the PostgreSQL Docker container starts
                with a fresh data volume. Click "Check Database Schema" to verify.
              </p>
              <Button onClick={handleCheckDbSchema} disabled={dbCheckStatus === 'loading'} variant="outline" className="btn-hover-primary-gradient shrink-0">
                {dbCheckStatus === 'loading' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Check Database Schema
              </Button>
            </div>
            {dbCheckStatus !== 'idle' && dbCheckMessage && (
              <div className="mt-4">
                {dbCheckStatus === 'ok' && (
                  <Alert variant="default" className="border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Schema OK</AlertTitle>
                    <AlertDescription>{dbCheckMessage}</AlertDescription>
                  </Alert>
                )}
                {(dbCheckStatus === 'partial' || (dbCheckStatus === 'error' && missingTables.length > 0)) && (
                  <Alert variant="destructive" className="border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-500">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="font-bold">Schema Issue: Tables Missing or Error During Check!</AlertTitle>
                    <AlertDescription>
                      <p className="font-semibold">{dbCheckMessage}</p>
                      {missingTables.length > 0 && (
                          <p className="mt-1">Missing tables detected: <strong>{missingTables.join(', ')}</strong>.</p>
                      )}
                      <p className="mt-2 text-base font-bold">This strongly indicates the initialization scripts in <code>./pg-init-scripts/</code> (e.g., <code>init-db.sql</code>) did not run or complete successfully during PostgreSQL initialization.</p>
                      <p className="mt-2 font-semibold">Common Cause for <code>init-db.sql</code> not running:</p>
                      <ul className="list-disc list-inside text-sm space-y-1 mt-1 ml-4">
                          <li><strong>PostgreSQL container logs might show an error like "<code>psql:/docker-entrypoint-initdb.d/init-db.sql: error: could not read from input file: Is a directory</code>".</strong> This means the <code>./pg-init-scripts</code> directory (containing <code>init-db.sql</code>) was not correctly mounted into the Docker container's <code>/docker-entrypoint-initdb.d/</code> directory. Docker might have created an empty directory there instead.</li>
                          <li>The <code>postgres_data</code> Docker volume already existed with data, so initialization was skipped.</li>
                      </ul>
                      <p className="mt-2 font-semibold">To resolve this:</p>
                      <ol className="list-decimal list-inside text-sm space-y-1 mt-2 bg-muted p-3 rounded-md">
                        <li><strong>Verify <code>pg-init-scripts/init-db.sql</code> File:</strong> Ensure you have a directory named <code>pg-init-scripts</code> in your project root (same level as <code>docker-compose.yml</code>), and that <code>init-db.sql</code> is inside this directory.</li>
                        <li><strong>Correct Volume Mount:</strong> Your <code>docker-compose.yml</code> should mount the directory: <code>./pg-init-scripts:/docker-entrypoint-initdb.d</code>. If using Portainer from Git, ensure this directory and its contents are present at the correct path in your repository.</li>
                        <li><strong>Stop all services:</strong> If running locally, use <code>docker-compose down</code>. In Portainer, stop the stack.</li>
                        <li><strong>CRITICAL - Remove Docker volumes:</strong> This step is crucial for a fresh database initialization.
                          <ul className="list-disc list-inside pl-5 text-xs">
                              <li>Locally: Run <code>docker-compose down -v</code>.</li>
                              <li>In Portainer: Manually delete the <code>postgres_data</code> volume associated with your stack via Portainer's "Volumes" section. Ensure you identify the correct volume name (e.g., <code>yourstackname_postgres_data</code>).</li>
                          </ul>
                        </li>
                        <li><strong>Restart services:</strong>
                          <ul className="list-disc list-inside pl-5 text-xs">
                              <li>Locally: Run <code>docker-compose up --build -d</code>.</li>
                              <li>In Portainer: Redeploy your stack, ensuring it uses a fresh PostgreSQL volume.</li>
                          </ul>
                         </li>
                        <li><strong>Verify PostgreSQL Container Logs:</strong> After startup, check the logs of your PostgreSQL container.
                          <ul className="list-disc list-inside pl-5 text-xs">
                              <li>Locally: Use <code>docker logs &lt;your_postgres_container_name&gt;</code>.</li>
                              <li>In Portainer: View the logs for the PostgreSQL container in the Portainer UI.</li>
                              <li>Look for messages indicating scripts from <code>/docker-entrypoint-initdb.d/</code> are being run (e.g., "running /docker-entrypoint-initdb.d/init-db.sql"). If you see errors like "Is a directory" or SQL errors, address the file mounting or script content.</li>
                          </ul>
                        </li>
                        <li>Once the underlying issue is fixed and PostgreSQL initializes correctly, click the "Check Database Schema" button again on this page.</li>
                      </ol>
                       <p className="mt-2 text-xs text-muted-foreground">Refer to the project's <code>README.md</code> for more detailed troubleshooting if issues persist.</p>
                    </AlertDescription>
                  </Alert>
                )}
                 {dbCheckStatus === 'error' && missingTables.length === 0 && (
                   <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Checking Schema</AlertTitle>
                    <AlertDescription>
                      <p>{dbCheckMessage}</p>
                       <p className="mt-2 font-semibold">Troubleshooting:</p>
                       <p className="text-xs mt-1">Ensure PostgreSQL is running and accessible. Verify your <code>DATABASE_URL</code>. If you suspect tables are missing but this check couldn't confirm, please follow the database re-initialization steps above and check PostgreSQL container logs.</p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </section>

          <section className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg text-foreground mb-2 flex items-center"><HardDrive className="mr-3 h-5 w-5 text-green-600 shrink-0" />2. File Storage Bucket (Automated by App)</h3>
             <p className="text-sm text-muted-foreground">
              The MinIO resume bucket (name defined by <code>MINIO_BUCKET_NAME</code>) is automatically checked and attempted to be created by the application when it first interacts with MinIO.
            </p>
            <p className="text-xs text-muted-foreground mt-1">Check application server logs for MinIO connection status (<code>src/lib/minio.ts</code>) and bucket creation messages.</p>
          </section>
          <section className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg text-foreground mb-2 flex items-center"><UserPlus className="mr-3 h-5 w-5 text-primary shrink-0" />3. Create Initial Admin User / Other Users</h3>
            <p className="text-sm text-muted-foreground mb-3">
              An initial admin user is recommended for full system access. Use the button below if you're logged in as an Admin.
              User passwords are securely hashed using bcrypt.
            </p>
            <div className="mt-2">
               {renderCreateAdminUserSection()}
            </div>
             <p className="text-xs text-muted-foreground mt-2">
                Note: The "User" table must exist for this to work. Verify DB schema status above first.
            </p>
          </section>
          <section className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg text-foreground mb-2 flex items-center"><Settings className="mr-3 h-5 w-5 text-primary shrink-0" />4. Configure Integrations (Optional)</h3>
            <p className="text-sm text-muted-foreground">
              If using n8n or SMTP, set up your details via the
              <Link href="/settings/integrations" className="text-primary hover:underline ml-1 font-medium">Integrations Settings</Link> page.
              For this prototype, n8n/SMTP UI settings are stored in browser localStorage. For production, ensure crucial URLs (like <code>N8N_RESUME_WEBHOOK_URL</code>) and SMTP details are configured as server-side environment variables.
            </p>
          </section>
           <section className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg text-foreground mb-2 flex items-center"><Settings className="mr-3 h-5 w-5 text-primary shrink-0" />5. Verify Azure AD SSO Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Ensure your Azure AD Client ID, Client Secret, and Tenant ID are correctly set in your <code>.env.local</code> file (or production environment variables) for single sign-on to function as expected.
            </p>
          </section>
          <section className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg text-foreground mb-2 flex items-center"><Settings className="mr-3 h-5 w-5 text-primary shrink-0" />6. Review Application Preferences (Optional)</h3>
            <p className="text-sm text-muted-foreground">
              Adjust any conceptual application preferences (like theme or app logo name) as needed via the
              <Link href="/settings/preferences" className="text-primary hover:underline ml-1 font-medium">Preferences Settings</Link> page.
            </p>
          </section>

          <div className="pt-6 text-center">
            <HelpCircle className="mx-auto h-10 w-10 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">
              Your Docker setup automates many initial steps. Refer to the <Link href="/README.md" className="text-primary hover:underline">README</Link> for detailed troubleshooting.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center py-6">
            <Button onClick={handleConfirmSetup} size="lg" className="btn-primary-gradient w-full max-w-xs">
                <LogIn className="mr-2 h-5 w-5" /> Confirm Setup & Proceed to Login
            </Button>
        </CardFooter>
      </Card>

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onOpenChange={setIsAddUserModalOpen}
        onAddUser={handleAddUserSubmit}
      />
    </div>
  );
}

    