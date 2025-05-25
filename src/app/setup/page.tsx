
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Settings, AlertTriangle, UserPlus, Database, HardDrive } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { AddUserModal, type AddUserFormValues } from "@/components/users/AddUserModal";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/lib/types"; // Assuming UserProfile might be needed

export default function SetupPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const { toast } = useToast();

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
      // Potentially refresh user list if one was displayed on this page, though not typical for setup.
    } catch (error) {
      console.error("Error adding user:", error);
      toast({ title: "Error Adding User", description: (error as Error).message, variant: "destructive" });
    }
  };

  const renderCreateAdminUserSection = () => {
    if (sessionStatus === 'loading') {
      return <Button variant="outline" size="sm" disabled>Loading session...</Button>;
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
      <Button variant="outline" size="sm" onClick={() => setIsAddUserModalOpen(true)}>
        <UserPlus className="mr-2 h-4 w-4" /> Create Admin User
      </Button>
    );
  };


  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-6 w-6 text-primary" />
            Application Setup Guide
          </CardTitle>
          <CardDescription>
            Guide for initial application setup and configuration. Many steps are automated with Docker.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Initial Setup Steps</h2>
            <ul className="list-decimal list-inside space-y-4 text-muted-foreground">
              <li>
                <div className="font-medium text-foreground mb-1">Database Initialization (Automated)</div>
                <div className="flex items-center text-sm">
                  <Database className="mr-2 h-4 w-4 text-green-500 shrink-0" />
                  <span>The database schema (tables) is automatically created by the <code>init-db.sql</code> script when the PostgreSQL container starts for the first time.</span>
                </div>
              </li>
              <li>
                <div className="font-medium text-foreground mb-1">File Storage Bucket (Automated)</div>
                 <div className="flex items-center text-sm">
                  <HardDrive className="mr-2 h-4 w-4 text-green-500 shrink-0" />
                  <span>The MinIO resume bucket (<code>{process.env.MINIO_BUCKET_NAME || 'canditrack-resumes'}</code>) is automatically checked and created by the application on its first interaction with MinIO.</span>
                </div>
              </li>
              <li>
                <div className="font-medium text-foreground mb-1">Create Initial Admin User / Other Users</div>
                <p className="text-sm mb-2">
                  Use the button below to add users to the system. The default mock admin is <code>admin@canditrack.com</code> (password: <code>password</code>) if using credentials login.
                </p>
                <div className="pl-5 mt-1">
                   {renderCreateAdminUserSection()}
                </div>
              </li>
              <li>
                <div className="font-medium text-foreground mb-1">Configure Integrations</div>
                <p className="text-sm">
                  Set up SMTP server details and n8n webhook URL (if applicable) via the
                  <Link href="/settings/integrations" className="text-primary hover:underline ml-1">Integrations Settings</Link> page.
                  These are stored in browser localStorage for this prototype. For production, use environment variables for actual integration.
                </p>
              </li>
               <li>
                <div className="font-medium text-foreground mb-1">Verify Azure AD SSO Configuration</div>
                <p className="text-sm">
                  Ensure your Azure AD Client ID, Client Secret, and Tenant ID are correctly set in your <code>.env.local</code> file for single sign-on to function.
                </p>
              </li>
              <li>
                <div className="font-medium text-foreground mb-1">Review Application Preferences</div>
                <p className="text-sm">
                  Adjust any conceptual application preferences (like theme or app logo name) as needed via the
                  <Link href="/settings/preferences" className="text-primary hover:underline ml-1">Preferences Settings</Link> page.
                </p>
              </li>
            </ul>
          </section>

          <section className="pt-4">
            <h2 className="text-xl font-semibold text-foreground mb-2">Important Considerations</h2>
            <div className="bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-500 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    <strong>Environment Variables:</strong> Crucial settings (database URLs, API keys, secrets)
                    are managed through your <code>.env.local</code> file (for local Docker development) or your deployment environment's secret management.
                    Refer to <code>.env.local.example</code> for a template.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="pt-4 text-center">
            <CheckCircle className="mx-auto h-10 w-10 text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">
              This page serves as a guide. Ensure all environment variables are correctly set up.
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

    