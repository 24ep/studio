
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Settings, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function SetupPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-6 w-6 text-primary" />
            Application Setup Guide
          </CardTitle>
          <CardDescription>
            Information about initial application setup and configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">Initial Setup Steps</h2>
            <p className="text-muted-foreground mb-3">
              Once the CandiTrack application is deployed and running (e.g., via Docker Compose),
              an administrator would typically perform the following initial setup tasks.
              Please note that the actual UI and automated processes for these steps are not yet fully implemented in this prototype.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong>Create Initial Admin User:</strong> If not already seeded, the first administrative user account would need to be created. This might involve a special registration form or a command-line script.
                <div className="pl-5 mt-1">
                  <Button variant="outline" size="sm" disabled>
                    Create Admin User (Not Implemented)
                  </Button>
                </div>
              </li>
              <li>
                <strong>Configure Integrations:</strong>
                <ul className="list-circle list-inside ml-5 mt-1 space-y-1">
                  <li>Verify Azure AD SSO settings are correct in your environment variables.</li>
                  <li>
                    Set up SMTP server details for email notifications via the 
                    <Link href="/settings/integrations" className="text-primary hover:underline ml-1">Integrations Settings</Link>.
                  </li>
                  <li>
                    Configure the n8n webhook URL if using workflow automation, also in
                    <Link href="/settings/integrations" className="text-primary hover:underline ml-1">Integrations Settings</Link>.
                  </li>
                </ul>
              </li>
              <li>
                <strong>Verify Database Connection:</strong> Ensure the application is successfully connected to the PostgreSQL database.
              </li>
              <li>
                <strong>Verify File Storage (MinIO):</strong> Confirm that MinIO is operational and the resume bucket is accessible.
              </li>
              <li>
                <strong>Review Application Preferences:</strong> Adjust any default application preferences as needed via the
                <Link href="/settings/preferences" className="text-primary hover:underline ml-1">Preferences Settings</Link>.
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
                    <strong>Environment Variables:</strong> Ensure all required environment variables (database URLs, API keys, secrets)
                    are correctly set in your <code>.env.local</code> file or your deployment environment. Refer to <code>.env.local.example</code>.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="pt-4 text-center">
            <CheckCircle className="mx-auto h-10 w-10 text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">
              This page serves as a guide. Actual setup mechanisms may vary based on deployment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
