"use client";

import { Database, Globe, User } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function UserPreferencesInfoCard() {
  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle className="text-lg">About User Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Your preferences are automatically saved to the database and will persist across all your devices and browser sessions.
          These settings are securely stored and synced in real-time.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
            <Database className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-green-800 dark:text-green-200 font-medium text-xs">Database Storage</p>
              <p className="text-green-700 dark:text-green-300 text-xs">Securely stored</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
            <Globe className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-blue-800 dark:text-blue-200 font-medium text-xs">Cross-Device Sync</p>
              <p className="text-blue-700 dark:text-blue-300 text-xs">Available everywhere</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-md">
            <User className="w-4 h-4 text-purple-600" />
            <div>
              <p className="text-purple-800 dark:text-purple-200 font-medium text-xs">Personalized</p>
              <p className="text-purple-700 dark:text-purple-300 text-xs">Tailored to you</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
