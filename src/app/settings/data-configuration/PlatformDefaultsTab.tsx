"use client";

import { useState } from "react";
import { DownloadCloud, Loader2, Settings2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getJsonErrorMessage, readJsonObject } from "@/lib/response-json";

export function PlatformDefaultsTab() {
  const [appKitLoad, setAppKitLoad] = useState<{
    environment: "development" | "production";
    percent: number;
    message: string;
  } | null>(null);
  const isImporting = appKitLoad !== null;

  const loadDefaults = async (environment: "development" | "production") => {
    try {
      setAppKitLoad({ environment, percent: 10, message: "Initializing AppKit request" });
      const response = await fetch("/api/settings/platform-default-settings/import-appkit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ environment }),
      });
      setAppKitLoad((current) => current ? { ...current, percent: 40, message: "Downloading defaults" } : null);

      if (!response.ok) {
        throw new Error(getJsonErrorMessage(await readJsonObject(response), "Failed to load platform defaults from AppKit"));
      }

      setAppKitLoad((current) => current ? { ...current, percent: 85, message: "Applying settings" } : null);
      toast.success(`Loaded platform defaults from AppKit ${environment}`);
    } catch (error) {
      console.error("Failed to load platform defaults from AppKit:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load platform defaults from AppKit");
    } finally {
      setAppKitLoad(null);
    }
  };

  return (
      <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Platform Default Settings</h2>
          <p className="text-sm text-muted-foreground">
            Load default app logo, match criteria, and applicant evaluation prompt from AppKit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isImporting}
            onClick={() => loadDefaults("development")}
          >
            {appKitLoad && appKitLoad.environment === "development"
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <DownloadCloud className="mr-2 h-4 w-4" />}
            {appKitLoad && appKitLoad.environment === "development"
              ? `${appKitLoad.percent}% · ${appKitLoad.message}`
              : "Load development defaults"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isImporting}
            onClick={() => loadDefaults("production")}
          >
            {appKitLoad && appKitLoad.environment === "production"
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <DownloadCloud className="mr-2 h-4 w-4" />}
            {appKitLoad && appKitLoad.environment === "production"
              ? `${appKitLoad.percent}% · ${appKitLoad.message}`
              : "Load live defaults"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 p-4">
          <Settings2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-medium">Loaded settings</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              App logo, default match criteria, and applicant evaluation prompt are now loaded only when you choose a source here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
