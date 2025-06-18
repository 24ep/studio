
"use client";
import { useState, useEffect, type ChangeEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Save, Settings, Mail, Zap, UploadCloud, FileText, XCircle, Loader2, AlertTriangle, ServerCrash, ShieldAlert, Info } from 'lucide-react'; 
import { signIn, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import type { SystemSetting } from '@/lib/types';
import { Separator } from '@/components/ui/separator';


export default function IntegrationsSettingsPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState(''); 
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpFromEmail, setSmtpFromEmail] = useState('');


  const fetchSMTPSettings = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/settings/system-settings');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to load SMTP settings' }));
        throw new Error(errorData.message);
      }
      const settings: SystemSetting[] = await response.json();
      
      setSmtpHost(settings.find(s => s.key === 'smtpHost')?.value || '');
      setSmtpPort(settings.find(s => s.key === 'smtpPort')?.value || '');
      setSmtpUser(settings.find(s => s.key === 'smtpUser')?.value || '');
      setSmtpSecure(settings.find(s => s.key === 'smtpSecure')?.value === 'true');
      setSmtpFromEmail(settings.find(s => s.key === 'smtpFromEmail')?.value || '');

    } catch (error) {
      console.error("Error fetching SMTP settings:", error);
      setFetchError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    setIsClient(true);
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
        if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('SYSTEM_SETTINGS_MANAGE')) { // Assuming SYSTEM_SETTINGS_MANAGE covers this
            setFetchError("You do not have permission to manage integration settings.");
            setIsLoading(false);
        } else {
            fetchSMTPSettings();
        }
    }
  }, [sessionStatus, session, pathname, signIn, fetchSMTPSettings]);


  const handleSaveIntegrations = async () => {
    if (!isClient) return;
    setIsSaving(true);
    
    const settingsToUpdate: SystemSetting[] = [
      { key: 'smtpHost', value: smtpHost },
      { key: 'smtpPort', value: smtpPort },
      { key: 'smtpUser', value: smtpUser },
      { key: 'smtpSecure', value: String(smtpSecure) },
      { key: 'smtpFromEmail', value: smtpFromEmail },
    ];

    try {
      const response = await fetch('/api/settings/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToUpdate),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save SMTP settings' }));
        throw new Error(errorData.message);
      }
      
      toast({
        title: 'SMTP Settings Saved',
        description: 'Your SMTP configuration has been updated on the server.',
      });
      fetchSMTPSettings(); 
    } catch (error) {
      console.error("Error saving SMTP settings:", error);
      toast({ title: "Error Saving SMTP Settings", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (sessionStatus === 'loading' || (isLoading && !fetchError && !isClient)) {
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
        <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient">Go to Dashboard</Button>
      </div>
    );
  }


  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Zap className="mr-3 h-6 w-6 text-primary" /> Workflow Automation (Webhooks)
          </CardTitle>
          <CardDescription>Details about server-configured webhooks for automated processing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
            <div>
              <h4 className="font-medium text-foreground flex items-center"><UploadCloud className="mr-2 h-5 w-5 text-muted-foreground"/>Resume Processing Webhook</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Used for resumes uploaded to existing candidates. Configured via server environment variable: <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">N8N_RESUME_WEBHOOK_URL</code>.
              </p>
            </div>
            <Separator />
            <div>
                <h4 className="font-medium text-foreground flex items-center"><FileText className="mr-2 h-5 w-5 text-muted-foreground"/>New Candidate PDF Webhook</h4>
                <p className="text-sm text-muted-foreground mt-1">
                    Used by "Create via Resume (Automated)" feature. Configured via server environment variable: <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">N8N_GENERIC_PDF_WEBHOOK_URL</code>.
                </p>
            </div>
             <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md">
                <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Note on Webhook Configuration</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                            The webhook URLs are set on the server using environment variables for security. This page provides information about their purpose. The actual mapping of data from these webhooks to candidate fields is configured in <Button variant="link" size="sm" className="p-0 h-auto text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300" onClick={() => router.push('/settings/webhook-mapping')}>Webhook Payload Mapping</Button>.
                        </p>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Mail className="mr-3 h-6 w-6 text-primary" /> SMTP Configuration
          </CardTitle>
          <CardDescription>Set up your SMTP server for sending application emails. Settings are saved on the server (excluding password).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
            <div>
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input id="smtp-host" type="text" placeholder="smtp.example.com" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="mt-1" disabled={isSaving}/>
            </div>
            <div>
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Input id="smtp-port" type="number" placeholder="587" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="mt-1" disabled={isSaving}/>
            </div>
             <div>
              <Label htmlFor="smtp-from-email">Sender Email Address</Label>
              <Input id="smtp-from-email" type="email" placeholder="noreply@example.com" value={smtpFromEmail} onChange={(e) => setSmtpFromEmail(e.target.value)} className="mt-1" disabled={isSaving}/>
            </div>
            <div>
              <Label htmlFor="smtp-user">SMTP Username</Label>
              <Input id="smtp-user" type="text" placeholder="your-email@example.com" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="mt-1" disabled={isSaving}/>
            </div>
            <div>
              <Label htmlFor="smtp-password">SMTP Password</Label>
              <Input id="smtp-password" type="password" placeholder="••••••••" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} className="mt-1" disabled={isSaving}/>
              <p className="text-xs text-muted-foreground mt-1">
                The SMTP password should be set as an environment variable (e.g., <code className="font-mono text-xs bg-muted px-1 rounded">SMTP_PASSWORD</code>) on the server for security. This field is for your reference and conceptual testing; its value is NOT saved to the database from here.
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-1">
                <Switch id="smtp-secure" checked={smtpSecure} onCheckedChange={setSmtpSecure} disabled={isSaving} className="switch-green"/>
                <Label htmlFor="smtp-secure" className="font-normal">Use TLS/SSL</Label>
            </div>
        </CardContent>
         <CardFooter className="border-t pt-6">
          <Button onClick={handleSaveIntegrations} className="w-full sm:w-auto btn-primary-gradient" disabled={isSaving || isLoading}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save SMTP Settings'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
