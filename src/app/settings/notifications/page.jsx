// src/app/settings/notifications/page.tsx
"use client";
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Save, Info, Loader2, ServerCrash, RefreshCw, Webhook, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Toggle } from '@/components/ui/toggle';
export default function NotificationSettingsPage() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [isClient, setIsClient] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [eventsWithSettings, setEventsWithSettings] = useState([]);
    const fetchNotificationSettings = useCallback(async () => {
        if (sessionStatus !== 'authenticated')
            return;
        setIsLoadingData(true);
        setFetchError(null);
        try {
            const response = await fetch('/api/settings/notifications');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to fetch notification settings' }));
                if (response.status === 401 || response.status === 403) {
                    return;
                }
                throw new Error(errorData.message);
            }
            const data = await response.json();
            setEventsWithSettings(data);
        }
        catch (error) {
            console.error("Error fetching notification settings:", error);
            setFetchError(error.message);
            setEventsWithSettings([]);
            toast.error(error.message);
        }
        finally {
            setIsLoadingData(false);
        }
    }, [sessionStatus]);
    useEffect(() => {
        var _a;
        setIsClient(true);
        if (sessionStatus === 'unauthenticated') {
            return;
        }
        else if (sessionStatus === 'authenticated') {
            if (session.user.role !== 'Admin' && !((_a = session.user.modulePermissions) === null || _a === void 0 ? void 0 : _a.includes('NOTIFICATION_SETTINGS_MANAGE'))) {
                setFetchError("You do not have permission to manage notification settings.");
                setIsLoadingData(false);
                return;
            }
            fetchNotificationSettings();
        }
    }, [sessionStatus, session, fetchNotificationSettings]);
    const handleSettingChange = (eventId, channelId, field, value) => {
        setEventsWithSettings(prevEvents => prevEvents.map(event => event.id === eventId
            ? Object.assign(Object.assign({}, event), { channels: event.channels.map(channel => channel.channelId === channelId
                    ? Object.assign(Object.assign(Object.assign({}, channel), (field === 'isEnabled' && { isEnabled: value })), (field === 'webhookUrl' && {
                        configuration: Object.assign(Object.assign({}, channel.configuration), { webhookUrl: value }),
                    })) : channel) }) : event));
    };
    const handleSaveSettings = async () => {
        if (!isClient)
            return;
        setIsSaving(true);
        const payload = eventsWithSettings.map(event => ({
            eventId: event.id,
            channels: event.channels.map(ch => {
                var _a;
                return ({
                    channelId: ch.channelId,
                    isEnabled: ch.isEnabled,
                    configuration: ch.channelKey === 'webhook' ? { webhookUrl: ((_a = ch.configuration) === null || _a === void 0 ? void 0 : _a.webhookUrl) || null } : null,
                });
            }),
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
            toast.success('Notification settings have been saved successfully.');
        }
        catch (error) {
            console.error("Error saving notification settings:", error);
            toast.error(error.message);
        }
        finally {
            setIsSaving(false);
        }
    };
    if (sessionStatus === 'loading' || (isLoadingData && !fetchError && !isClient && eventsWithSettings.length === 0)) {
        return (<div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
            <Loader2 className="h-16 w-16 animate-spin text-primary"/>
        </div>);
    }
    if (fetchError && !isLoadingData) {
        return (<div className="flex flex-col items-center justify-center h-full text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4"/>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied or Error</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient mr-2">Go to Dashboard</Button>
        {fetchError !== "You do not have permission to manage notification settings." &&
                <Button onClick={fetchNotificationSettings} variant="outline"><RefreshCw className="mr-2 h-4 w-4"/>Try Again</Button>}
      </div>);
    }
    return (<Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={handleSaveSettings} className="btn-primary-gradient flex items-center gap-2" disabled={isSaving || isLoadingData || !!fetchError || eventsWithSettings.length === 0}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
            {isSaving ? 'Saving...' : 'Save All'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
          <Alert variant="default" className="mb-6 bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
            <AlertTitle className="font-semibold text-blue-700 dark:text-blue-300">Important Note</AlertTitle>
            <AlertDescription>
              This page allows you to configure notification preferences. However, the actual logic to *trigger* these notifications (i.e., send emails or make webhook calls when events occur) is a separate implementation step and is **not yet active**.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-6 p-6">
            {isLoadingData && eventsWithSettings.length === 0 ? (<div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                  <p className="ml-2 text-muted-foreground">Loading notification events...</p>
              </div>) : eventsWithSettings.length === 0 && !fetchError ? (<p className="text-muted-foreground text-center py-8">No notification events defined in the system yet.</p>) : (eventsWithSettings.map(event => (<Card key={event.id} className="p-4 shadow-sm">
                  <div className="mb-3">
                    <h4 className="font-semibold text-lg text-foreground">{event.label}</h4>
                    {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                  </div>
                  <div className="space-y-3">
                    {event.channels.map(channel => {
                var _a;
                return (<div key={channel.channelId} className="p-3 border rounded-md bg-muted/30">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`enabled-${event.id}-${channel.channelId}`} className="flex items-center text-sm font-medium">
                            {channel.channelKey === 'email' ? <Mail className="mr-2 h-4 w-4 text-blue-500"/> : <Webhook className="mr-2 h-4 w-4 text-purple-500"/>}
                            {channel.channelLabel}
                          </Label>
                          <Toggle id={`enabled-${event.id}-${channel.channelId}`} checked={channel.isEnabled} onCheckedChange={(checked) => handleSettingChange(event.id, channel.channelId, 'isEnabled', checked)} variant="success"/>
                        </div>
                        {channel.channelKey === 'webhook' && channel.isEnabled && (<div className="mt-2.5">
                            <Label htmlFor={`webhookUrl-${event.id}-${channel.channelId}`} className="text-xs text-muted-foreground">Webhook URL</Label>
                            <Input id={`webhookUrl-${event.id}-${channel.channelId}`} type="url" value={((_a = channel.configuration) === null || _a === void 0 ? void 0 : _a.webhookUrl) || ''} onChange={(e) => handleSettingChange(event.id, channel.channelId, 'webhookUrl', e.target.value)} placeholder="https://your-webhook-endpoint.com/..." className="mt-1 text-xs h-8"/>
                          </div>)}
                      </div>);
            })}
                  </div>
                </Card>)))}
          </div>
      </CardContent>
    </Card>);
}
