
// src/app/settings/notifications/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Save, BellRing, Info, Loader2, ServerCrash, ShieldAlert, RefreshCw, Webhook, Mail } from 'lucide-react';
import type { NotificationEventWithSettings, NotificationChannel, NotificationSetting } from '@/lib/types';

export default function NotificationSettingsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const [isClient, setIsClient] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [eventsWithSettings, setEventsWithSettings] = useState<NotificationEventWithSettings[]>([]);

  const fetchNotificationSettings = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;
    setIsLoadingData(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/settings/notifications');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch notification settings' }));
        if (response.status === 401 || response.status === 403) {
          signIn(undefined, { callbackUrl: pathname });
          return;
        }
        throw new Error(errorData.message);
      }
      const data: NotificationEventWithSettings[] = await response.json();
      setEventsWithSettings(data);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      setFetchError((error as Error).message);
      setEventsWithSettings([]);
      toast({title: "Error Loading Settings", description: (error as Error).message, variant: "destructive"});
    } finally {
      setIsLoadingData(false);
    }
  }, [sessionStatus, pathname, signIn, toast]);

  useEffect(() => {
    setIsClient(true);
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
       if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('NOTIFICATION_SETTINGS_MANAGE')) {
        setFetchError("You do not have permission to manage notification settings.");
        setIsLoadingData(false);
        return;
      }
      fetchNotificationSettings();
    }
  }, [sessionStatus, session, pathname, signIn, fetchNotificationSettings]);

  const handleSettingChange = (
    eventId: string,
    channelId: string,
    field: 'isEnabled' | 'webhookUrl',
    value: boolean | string
  ) => {
    setEventsWithSettings(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId
          ? {
              ...event,
              channels: event.channels.map(channel =>
                channel.channelId === channelId
                  ? {
                      ...channel,
                      ...(field === 'isEnabled' && { isEnabled: value as boolean }),
                      ...(field === 'webhookUrl' && {
                        configuration: { ...channel.configuration, webhookUrl: value as string },
                      }),
                    }
                  : channel
              ),
            }
          : event
      )
    );
  };
  
  const handleSaveSettings = async () => {
    if (!isClient) return;
    setIsSaving(true);
    const payload = eventsWithSettings.map(event => ({
        eventId: event.id,
        channels: event.channels.map(ch => ({
            channelId: ch.channelId,
            isEnabled: ch.isEnabled,
            configuration: ch.channelKey === 'webhook' ? { webhookUrl: ch.configuration?.webhookUrl || null } : null,
        })),
    }));

    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save notification settings');
      }
      setEventsWithSettings(result); // Update state with response from server (might include new IDs, etc.)
      toast({ title: 'Settings Saved', description: 'Notification settings have been saved successfully.' });
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({title: "Error Saving Settings", description: (error as Error).message, variant: "destructive"});
    } finally {
      setIsSaving(false);
    }
  };
  
  if (sessionStatus === 'loading' || (isLoadingData && !fetchError && !isClient)) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied or Error</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient mr-2">Go to Dashboard</Button>
        {fetchError !== "You do not have permission to manage notification settings." && 
            <Button onClick={fetchNotificationSettings} variant="outline"><RefreshCw className="mr-2 h-4 w-4"/>Try Again</Button>
        }
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><BellRing className="mr-2 h-6 w-6 text-primary"/>Notification Settings</CardTitle>
          <CardDescription>
            Configure which actions in the system trigger notifications and through which channels (e.g., Email, Webhook).
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Alert variant="default" className="mb-6 bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="font-semibold text-blue-700 dark:text-blue-300">Important Note</AlertTitle>
              <AlertDescription>
                This page allows you to configure notification preferences. However, the actual logic to *trigger* these notifications (i.e., send emails or make webhook calls when events occur) is a separate implementation step and is **not yet active**.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-6">
              {isLoadingData && eventsWithSettings.length === 0 ? (
                 <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2 text-muted-foreground">Loading notification events...</p>
                </div>
              ) : eventsWithSettings.length === 0 && !fetchError ? (
                <p className="text-muted-foreground text-center py-8">No notification events defined in the system yet.</p>
              ) : (
                eventsWithSettings.map(event => (
                  <Card key={event.id} className="p-4 shadow-sm">
                    <div className="mb-3">
                      <h4 className="font-semibold text-lg text-foreground">{event.label}</h4>
                      {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                    </div>
                    <div className="space-y-3">
                      {event.channels.map(channel => (
                        <div key={channel.channelId} className="p-3 border rounded-md bg-muted/30">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`enabled-${event.id}-${channel.channelId}`} className="flex items-center text-sm font-medium">
                              {channel.channelKey === 'email' ? <Mail className="mr-2 h-4 w-4 text-blue-500"/> : <Webhook className="mr-2 h-4 w-4 text-purple-500"/>}
                              {channel.channelLabel}
                            </Label>
                            <Switch
                              id={`enabled-${event.id}-${channel.channelId}`}
                              checked={channel.isEnabled}
                              onCheckedChange={(checked) => handleSettingChange(event.id, channel.channelId, 'isEnabled', checked)}
                              className="switch-green"
                            />
                          </div>
                          {channel.channelKey === 'webhook' && channel.isEnabled && (
                            <div className="mt-2.5">
                              <Label htmlFor={`webhookUrl-${event.id}-${channel.channelId}`} className="text-xs text-muted-foreground">Webhook URL</Label>
                              <Input
                                id={`webhookUrl-${event.id}-${channel.channelId}`}
                                type="url"
                                value={channel.configuration?.webhookUrl || ''}
                                onChange={(e) => handleSettingChange(event.id, channel.channelId, 'webhookUrl', e.target.value)}
                                placeholder="https://your-webhook-endpoint.com/..."
                                className="mt-1 text-xs h-8"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                ))
              )}
            </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end mt-6">
        <Button onClick={handleSaveSettings} size="lg" className="btn-primary-gradient" disabled={isSaving || isLoadingData || !!fetchError || eventsWithSettings.length === 0}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save Notification Settings'}
        </Button>
      </div>
    </div>
  );
}
    