"use client";
import { useState, useEffect, type ChangeEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Save, Settings, Mail, Zap, UploadCloud, FileText, XCircle, Loader2, AlertTriangle, ServerCrash, ShieldAlert, Info, BrainCircuit, StickyNote, RefreshCw } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import type { SystemSetting } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-hot-toast';
import { Toggle } from '@/components/ui/toggle';


export default function IntegrationsSettingsPage() {
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
  const [n8nResumeWebhookUrl, setN8nResumeWebhookUrl] = useState('');
  const [n8nGenericPdfWebhookUrl, setN8nGenericPdfWebhookUrl] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');


  const fetchSystemSettings = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/settings/system-settings');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to load system settings' }));
        throw new Error(errorData.message);
      }
      const settings: SystemSetting[] = await response.json();

      setSmtpHost(settings.find(s => s.key === 'smtpHost')?.value || '');
      setSmtpPort(settings.find(s => s.key === 'smtpPort')?.value || '');
      setSmtpUser(settings.find(s => s.key === 'smtpUser')?.value || '');
      setSmtpSecure(settings.find(s => s.key === 'smtpSecure')?.value === 'true');
      setSmtpFromEmail(settings.find(s => s.key === 'smtpFromEmail')?.value || '');
      setN8nResumeWebhookUrl(settings.find(s => s.key === 'n8nResumeWebhookUrl')?.value || '');
      setN8nGenericPdfWebhookUrl(settings.find(s => s.key === 'n8nGenericPdfWebhookUrl')?.value || '');
      setGeminiApiKey(settings.find(s => s.key === 'geminiApiKey')?.value || '');

    } catch (error) {
      console.error("Error fetching system settings:", error);
      setFetchError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
        if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('SYSTEM_SETTINGS_MANAGE')) {
            setFetchError("You do not have permission to manage integration settings.");
            setIsLoading(false);
        } else {
            fetchSystemSettings();
        }
    }
  }, [sessionStatus, session, pathname, fetchSystemSettings]);


  const handleSaveSettings = async () => {
    if (sessionStatus === 'loading') return;
    setIsSaving(true);

    const settingsToUpdate: SystemSetting[] = [
      { key: 'smtpHost', value: smtpHost },
      { key: 'smtpPort', value: smtpPort },
      { key: 'smtpUser', value: smtpUser },
      { key: 'smtpSecure', value: String(smtpSecure) },
      { key: 'smtpFromEmail', value: smtpFromEmail },
      { key: 'n8nResumeWebhookUrl', value: n8nResumeWebhookUrl },
      { key: 'n8nGenericPdfWebhookUrl', value: n8nGenericPdfWebhookUrl },
      { key: 'geminiApiKey', value: geminiApiKey },
    ];

    // Note: smtpPassword is not saved to the DB via this UI.
    // It must be set as an environment variable on the server.

    try {
      const response = await fetch('/api/settings/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToUpdate),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save settings' }));
        throw new Error(errorData.message);
      }

      toast.success('Settings Saved');
      fetchSystemSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (sessionStatus === 'loading' || (isLoading && !fetchError)) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  if (fetchError && !isLoading) {
     return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied or Error</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient">Go to Dashboard</Button>
      </div>
    );
  }


  return (
    <div className="space-y-12 pb-32 p-6">
      {/* AI Configuration */}
      <Card className="shadow-lg ">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl gap-2">
            <BrainCircuit className="h-7 w-7 text-primary" />
            AI Configuration (Gemini)
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Configure your Google AI Gemini API Key for AI-powered features like advanced candidate search.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div>
            <Label htmlFor="gemini-api-key">Gemini API Key</Label>
            <Input id="gemini-api-key" type="password" placeholder="Enter your Gemini API Key" value={geminiApiKey} onChange={(e) => setGeminiApiKey(e.target.value)} className="mt-1" disabled={isSaving}/>
            <p className="text-xs text-muted-foreground mt-1">This key is stored securely on the server. For Genkit to use this, ensure it&apos;s also available as the GOOGLE_API_KEY environment variable where your Next.js server runs, or ensure your Genkit flows dynamically fetch it.</p>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Automation */}
      <Card className="shadow-lg ">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl gap-2">
            <Zap className="h-7 w-7 text-primary" />
            Workflow Automation (Webhooks)
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Configure server-side webhook URLs for automated processing tasks via n8n or similar tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div>
            <Label htmlFor="n8n-resume-webhook">Resume Processing Webhook URL</Label>
            <Input id="n8n-resume-webhook" type="url" placeholder="https://your-n8n-instance/webhook/resume-processing" value={n8nResumeWebhookUrl} onChange={(e) => setN8nResumeWebhookUrl(e.target.value)} className="mt-1" disabled={isSaving}/>
            <p className="text-xs text-muted-foreground mt-1">Used for resumes uploaded to existing candidates. The application will send candidate details and a MinIO presigned URL for the resume to this endpoint.</p>
          </div>
          <Separator />
          <div>
            <Label htmlFor="n8n-generic-pdf-webhook">New Candidate PDF Webhook URL</Label>
            <Input id="n8n-generic-pdf-webhook" type="url" placeholder="https://your-n8n-instance/webhook/new-candidate-pdf" value={n8nGenericPdfWebhookUrl} onChange={(e) => setN8nGenericPdfWebhookUrl(e.target.value)} className="mt-1" disabled={isSaving}/>
            <p className="text-xs text-muted-foreground mt-1">Used by &quot;Create via Resume (Automated)&quot; feature. The application sends the PDF file (as FormData) and optional target position info to this endpoint. This webhook should then call back to <code className='font-mono text-xs bg-muted px-1 rounded'>/api/n8n/create-candidate-with-matches</code>.</p>
          </div>
        </CardContent>
      </Card>

      {/* SMTP Configuration */}
      <Card className="shadow-lg ">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl gap-2">
            <Mail className="h-7 w-7 text-primary" />
            SMTP Configuration
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Set up your SMTP server for sending application emails. Settings are saved on the server (excluding password).
          </CardDescription>
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
            <Label htmlFor="smtp-password">SMTP Password (Set via Environment Variable)</Label>
            <Input id="smtp-password" type="password" placeholder="••••••••" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} className="mt-1" disabled={isSaving}/>
            <p className="text-xs text-muted-foreground mt-1">
              The SMTP password should be set as an environment variable (e.g., <code className="font-mono text-xs bg-muted px-1 rounded">SMTP_PASSWORD</code>) on the server for security. This field is for your reference and conceptual testing; its value is NOT saved to the database from here.
            </p>
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <Toggle id="smtp-secure" checked={smtpSecure} onCheckedChange={setSmtpSecure} disabled={isSaving} variant="success"/>
            <Label htmlFor="smtp-secure" className="font-normal">Use TLS/SSL</Label>
          </div>
        </CardContent>
      </Card>

      {/* Floating Save/Reset Bar */}
      <div className="fixed bottom-0 left-0 w-full z-30 bg-background/95 border-t flex justify-center items-center gap-4 py-3 px-4 shadow-lg" style={{boxShadow: '0 -2px 16px 0 rgba(0,0,0,0.04)'}}>
        <Button onClick={handleSaveSettings} disabled={isSaving || isLoading} className="btn-primary-gradient flex items-center gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save All
        </Button>
        <Button variant="outline" onClick={fetchSystemSettings} disabled={isSaving || isLoading} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Reset
        </Button>
      </div>
    </div>
  );
}

    