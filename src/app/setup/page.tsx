
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { CheckCircle, Settings, AlertTriangle, UserPlus, Database, HardDrive, HelpCircle, RefreshCw, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { AddUserModal, type AddUserFormValues } from "@/components/users/AddUserModal";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/lib/types"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function SetupPage() {
  const { data: session, status: sessionStatus } = useSession();
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
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Settings className="mr-3 h-7 w-7 text-primary" />
            Application Setup Guide
          </CardTitle>
          <CardDescription>
            Guide for initial application setup and configuration. Many steps are automated with Docker.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Database Schema Status</h2>
            <Card className="p-4 shadow-sm bg-card hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground flex-1">
                  This check verifies if essential database tables (e.g., "User", "Candidate", "Position") have been created.
                  These tables should be automatically created by the <code>init-db.sql</code> script when the PostgreSQL Docker container starts
                  with a fresh data volume.
                </p>
                <Button onClick={handleCheckDbSchema} disabled={dbCheckStatus === 'loading'} variant="outline" className="btn-hover-primary-gradient">
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
                      <AlertTitle>Schema Issue: Tables Missing or Error During Check</AlertTitle>
                      <AlertDescription>
                        <p>{dbCheckMessage}</p>
                        {missingTables.length > 0 && (
                            <p className="mt-1">Missing tables detected: <strong>{missingTables.join(', ')}</strong>.</p>
                        )}
                        <p className="mt-2 font-semibold">This strongly indicates the <code>init-db.sql</code> script did not run or complete successfully during PostgreSQL initialization.</p>
                        <p className="mt-2 font-bold">Troubleshooting Steps:</p>
                        <ol className="list-decimal list-inside text-xs space-y-1 mt-1">
                          <li><strong>Stop all services:</strong> Run <code>docker-compose down</code> in your project terminal.</li>
                          <li><strong>CRITICAL - Remove Docker volumes:</strong> Run <code>docker-compose down -v</code>. This deletes existing database data and ensures a fresh start for PostgreSQL.</li>
                          <li><strong>Restart services:</strong> Run <code>docker-compose up --build -d</code>. This will rebuild if necessary and re-initialize the PostgreSQL database, forcing it to execute <code>init-db.sql</code>.</li>
                          <li><strong>Check PostgreSQL container logs:</strong> After startup, if issues persist, check the logs of your PostgreSQL container (<code>docker logs &lt;your_postgres_container_name&gt;</code>) for any errors during the execution of <code>init-db.sql</code>. Look for messages like "Is a directory" or SQL syntax errors.</li>
                          <li>Refer to the project's <code>README.md</code> for more detailed troubleshooting.</li>
                        </ol>
                      </AlertDescription>
                    </Alert>
                  )}
                   {dbCheckStatus === 'error' && missingTables.length === 0 && (
                     <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error Checking Schema</AlertTitle>
                      <AlertDescription>
                        {dbCheckMessage}
                         <p className="mt-2 font-semibold">Troubleshooting:</p>
                         <p className="text-xs mt-1">Ensure PostgreSQL is running and accessible. Verify <code>DATABASE_URL</code>. If you suspect tables are missing but this check couldn't confirm, please follow the database re-initialization steps above and check PostgreSQL container logs.</p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </Card>
          </section>


          <section className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg text-foreground mb-2 flex items-center"><Database className="mr-3 h-5 w-5 text-green-600 shrink-0" />1. Database Initialization (Automated)</h3>
            <p className="text-sm text-muted-foreground">
              The database schema (tables for Candidates, Positions, Users, Logs, etc.) is automatically created by the <code>init-db.sql</code> script when the PostgreSQL Docker container starts for the first time (or with an empty data volume).
            </p>
             <p className="text-xs text-muted-foreground mt-1">
                This is configured in <code>docker-compose.yml</code> by mounting <code>./init-db.sql</code> into the PostgreSQL container's <code>/docker-entrypoint-initdb.d/</code> directory.
                If tables are missing (verify with the "Check Database Schema" button above), ensure the <code>postgres_data</code> Docker volume was cleared before the last <code>docker-compose up</code> (e.g., using <code>docker-compose down -v</code>).
                Always check the PostgreSQL container logs for details if initialization issues occur.
             </p>
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
              **Ensure to change default passwords and implement password hashing in production.**
            </p>
            <div className="mt-2">
               {renderCreateAdminUserSection()}
            </div>
          </section>
          <section className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg text-foreground mb-2 flex items-center"><Settings className="mr-3 h-5 w-5 text-primary shrink-0" />4. Configure Integrations</h3>
            <p className="text-sm text-muted-foreground">
              Set up SMTP server details and n8n webhook URL (if applicable) via the
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
            <h3 className="font-semibold text-lg text-foreground mb-2 flex items-center"><Settings className="mr-3 h-5 w-5 text-primary shrink-0" />6. Review Application Preferences</h3>
            <p className="text-sm text-muted-foreground">
              Adjust any conceptual application preferences (like theme or app logo name) as needed via the
              <Link href="/settings/preferences" className="text-primary hover:underline ml-1 font-medium">Preferences Settings</Link> page.
            </p>
          </section>
        

          <section className="pt-6">
            <h2 className="text-xl font-semibold text-foreground mb-3">Important Considerations</h2>
            <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    <strong>Environment Variables:</strong> Crucial settings (database URLs, API keys, all secrets)
                    are managed through your <code>.env.local</code> file (for local Docker development) or your deployment environment's secret management.
                    Refer to <code>.env.local.example</code> for a template. These are vital for security and proper functioning in production.
                  </p>
                </div>
              </div>
            </div>
             <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-md mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    <strong>Password Security:</strong> The current Credentials Provider setup and user creation API store and compare passwords in **plaintext**. This is **highly insecure** and for demonstration purposes only.
                    In a production environment, you **MUST** implement password hashing (e.g., using bcrypt) before storing passwords and use secure comparison methods during login.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="pt-6 text-center">
            <HelpCircle className="mx-auto h-10 w-10 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">
              Your Docker setup automates many initial steps. Refer to the <Link href="/README.md" className="text-primary hover:underline">README</Link> for detailed troubleshooting.
            </p>
          </div>
        </CardContent>
      </Card>

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onOpenChange={setIsAddUserModalOpen}
        onAddUser={handleAddUserSubmit}
      />
    </div>
  );
}
