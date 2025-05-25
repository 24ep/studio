
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Settings, AlertTriangle, UserPlus, Database, HardDrive } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { AddUserModal, type AddUserFormValues } from "@/components/users/AddUserModal";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/lib/types"; 

export default function SetupPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add user');
      }
      const newUser = await response.json();
      toast({ title: "Success", description: `User ${newUser.name} added successfully.` });
      setIsAddUserModalOpen(false);
    } catch (error) {
      console.error("Error adding user:", error);
      toast({ title: "Error Adding User", description: (error as Error).message, variant: "destructive" });
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
            <h2 className="text-xl font-semibold text-foreground mb-4">Initial Setup Steps</h2>
            <ul className="space-y-4">
              <li className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg text-foreground mb-2">1. Database Initialization (Automated)</h3>
                <div className="flex items-start text-sm text-muted-foreground">
                  <Database className="mr-3 h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span>The database schema (tables for Candidates, Positions, Logs, etc.) is automatically created by the <code>init-db.sql</code> script when the PostgreSQL Docker container starts for the first time (or with an empty data volume).</span>
                </div>
              </li>
              <li className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg text-foreground mb-2">2. File Storage Bucket (Automated)</h3>
                 <div className="flex items-start text-sm text-muted-foreground">
                  <HardDrive className="mr-3 h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span>The MinIO resume bucket (name defined by <code>MINIO_BUCKET_NAME</code>, default: <code>canditrack-resumes</code>) is automatically checked and created by the application when it first interacts with MinIO.</span>
                </div>
              </li>
              <li className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg text-foreground mb-2">3. Create Initial Admin User / Other Users</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  An initial admin user is recommended for full system access. The default mock admin (if using credentials login before Azure AD sync) is <code>admin@canditrack.com</code> (password: <code>password</code>). Use the button below to add users if logged in as an Admin.
                </p>
                <div className="mt-2">
                   {renderCreateAdminUserSection()}
                </div>
              </li>
              <li className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg text-foreground mb-2">4. Configure Integrations</h3>
                <p className="text-sm text-muted-foreground">
                  Set up SMTP server details and n8n webhook URL (if applicable) via the
                  <Link href="/settings/integrations" className="text-primary hover:underline ml-1 font-medium">Integrations Settings</Link> page.
                  For this prototype, these settings are stored in browser localStorage. For production, ensure crucial URLs (like `N8N_RESUME_WEBHOOK_URL`) and SMTP details are configured as server-side environment variables.
                </p>
              </li>
               <li className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg text-foreground mb-2">5. Verify Azure AD SSO Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Ensure your Azure AD Client ID, Client Secret, and Tenant ID are correctly set in your <code>.env.local</code> file (or production environment variables) for single sign-on to function as expected.
                </p>
              </li>
              <li className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg text-foreground mb-2">6. Review Application Preferences</h3>
                <p className="text-sm text-muted-foreground">
                  Adjust any conceptual application preferences (like theme or app logo name) as needed via the
                  <Link href="/settings/preferences" className="text-primary hover:underline ml-1 font-medium">Preferences Settings</Link> page.
                </p>
              </li>
            </ul>
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
          </section>

          <div className="pt-6 text-center">
            <CheckCircle className="mx-auto h-10 w-10 text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">
              Your Docker setup automates many initial steps. Ensure all environment variables are correctly set for a smooth experience.
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

    