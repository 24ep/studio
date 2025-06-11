// src/app/setup-guidance/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, DatabaseZap, RefreshCw, ServerCrash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

export default function SetupGuidancePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>("Checking database status...");
  const [missingTables, setMissingTables] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const performCheck = useCallback(async (isInitialCheck = false) => {
    setIsChecking(true);
    setApiError(null);
    if(!isInitialCheck) setCheckMessage("Re-checking database status...");
    else setCheckMessage("Verifying database setup...");

    try {
      const response = await fetch('/api/system/initial-setup-check');
      const data = await response.json();
      
      if (!response.ok) { // API returned 500 or other non-200 error
        setApiError(data.message || "Failed to connect to the setup check API.");
        setMissingTables([]);
        setCheckMessage("Error during setup check.");
        return;
      }

      if (data.schemaInitialized) {
        setCheckMessage("Database schema found! Redirecting to application...");
        setTimeout(() => router.replace('/'), 1500); // Redirect to homepage
      } else {
        setMissingTables(data.missingTables || []);
        setCheckMessage(data.message || "Database schema needs initialization.");
        if (data.error && data.code === '42P01') { // Specific DB error for missing table
            setApiError(`Database access error: ${data.message}. This often means the database hasn't been initialized correctly.`);
        } else if (data.error) {
            setApiError(`An error occurred: ${data.message}`);
        }
      }
    } catch (error) {
      console.error("Error during setup check API call:", error);
      setApiError("Could not reach the setup check API. Ensure the application server is running.");
      setCheckMessage("Failed to verify database status.");
    } finally {
      setIsChecking(false);
    }
  }, [router]);

  useEffect(() => {
    performCheck(true);
  }, [performCheck]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <DatabaseZap className="mr-3 h-7 w-7 text-primary" />
            Application Setup Required
          </CardTitle>
          <CardDescription>
            The application needs its database schema to be initialized.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {isChecking && !apiError && (
            <div className="p-3 border border-blue-300 bg-blue-50 rounded-md text-sm text-blue-700 flex items-center">
              <RefreshCw className="h-5 w-5 mr-2 animate-spin"/> {checkMessage}
            </div>
          )}

          {apiError && (
            <div className="p-3 border border-destructive bg-destructive/10 rounded-md text-sm text-destructive-foreground flex items-start">
              <ServerCrash className="h-5 w-5 mr-2 shrink-0 mt-0.5"/> 
              <div>
                <span className="font-semibold">Error:</span> {apiError}
                 {apiError.includes("relation") && apiError.includes("does not exist") && 
                    <p className="text-xs mt-1">This usually indicates the `init-db.sql` script did not run correctly.</p>
                 }
              </div>
            </div>
          )}

          {!isChecking && missingTables.length > 0 && (
            <div className="p-3 border border-amber-500 bg-amber-50 rounded-md text-sm text-amber-800">
              <div className="flex items-center font-semibold">
                <AlertCircle className="h-5 w-5 mr-2 text-amber-600"/> The following essential tables seem to be missing:
              </div>
              <ul className="list-disc list-inside pl-5 mt-1">
                {missingTables.map(table => <li key={table}>{table}</li>)}
              </ul>
            </div>
          )}
          {!isChecking && !apiError && !missingTables.length && checkMessage && !checkMessage.startsWith("Database schema found") && (
             <div className="p-3 border border-amber-500 bg-amber-50 rounded-md text-sm text-amber-800 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-amber-600"/> {checkMessage}
            </div>
          )}


          <p className="text-muted-foreground pt-2">
            To set up the database, please follow these steps:
          </p>
          
          <div className="font-semibold text-foreground">Instructions:</div>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground pl-4">
            <li>
              <strong>Stop all running Docker containers for this application:</strong>
              <pre className="mt-1 p-2 bg-muted text-foreground rounded-md text-xs overflow-x-auto break-all"><code>docker-compose down</code></pre>
            </li>
            <li>
              <strong>CRITICAL: Remove the PostgreSQL Docker volume.</strong> This ensures a fresh database initialization.
              <pre className="mt-1 p-2 bg-muted text-foreground rounded-md text-xs overflow-x-auto break-all"><code>docker-compose down -v</code></pre>
              <p className="text-xs mt-1 text-destructive">Warning: This step deletes ALL data in the <code className="bg-muted/50 px-0.5 rounded-sm">postgres_data</code> volume.</p>
            </li>
            <li>
              Ensure the <code className="bg-muted px-1 py-0.5 rounded-sm">pg-init-scripts/init-db.sql</code> file exists in your project root and is correctly configured.
            </li>
            <li>
              <strong>Restart the services:</strong>
              <pre className="mt-1 p-2 bg-muted text-foreground rounded-md text-xs overflow-x-auto break-all"><code>docker-compose up --build -d</code></pre>
            </li>
            <li>
              After the services have started (wait about 30-60 seconds for DB initialization), click the "Re-check Status" button below.
            </li>
          </ol>
           <p className="text-sm text-muted-foreground pt-2">
            For detailed troubleshooting, consult the <code className="bg-muted px-1 py-0.5 rounded-sm">README.md</code> and check the logs of your <code className="bg-muted px-1 py-0.5 rounded-sm">postgres</code> Docker container (e.g., using <code className="bg-muted px-1 py-0.5 rounded-sm">docker logs yourprojectname-postgres-1</code>).
          </p>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button onClick={() => performCheck(false)} disabled={isChecking}>
            {isChecking && !checkMessage?.startsWith("Verifying") ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Re-check Status
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
