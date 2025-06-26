"use client";
import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback } from 'react';
import 'react-quill/dist/quill.snow.css';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, Mail, Zap, BrainCircuit, Loader2, ServerCrash, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-hot-toast';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function SystemSettingsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // System/Integration settings state
  const [maxConcurrentProcessors, setMaxConcurrentProcessors] = useState(5);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [resumeProcessingWebhookUrl, setResumeProcessingWebhookUrl] = useState('');
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
      const settings = await response.json();
      setMaxConcurrentProcessors(parseInt(settings.maxConcurrentProcessors || '5', 10));
      setSmtpHost(settings.smtpHost || '');
      setSmtpPort(settings.smtpPort || '');
      setSmtpUser(settings.smtpUser || '');
      setSmtpSecure(settings.smtpSecure === 'true');
      setSmtpFromEmail(settings.smtpFromEmail || '');
      setResumeProcessingWebhookUrl(settings.resumeProcessingWebhookUrl || settings.n8nResumeWebhookUrl || '');
      setN8nGenericPdfWebhookUrl(settings.n8nGenericPdfWebhookUrl || '');
      setGeminiApiKey(settings.geminiApiKey || '');
    } catch (error) {
      setFetchError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
      fetchSystemSettings();
    }
  }, [sessionStatus, pathname, fetchSystemSettings]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const settingsToUpdate = [
      { key: 'maxConcurrentProcessors', value: String(maxConcurrentProcessors) },
      { key: 'smtpHost', value: smtpHost },
      { key: 'smtpPort', value: smtpPort },
      { key: 'smtpUser', value: smtpUser },
      { key: 'smtpSecure', value: String(smtpSecure) },
      { key: 'smtpFromEmail', value: smtpFromEmail },
      { key: 'resumeProcessingWebhookUrl', value: resumeProcessingWebhookUrl },
      { key: 'n8nGenericPdfWebhookUrl', value: n8nGenericPdfWebhookUrl },
      { key: 'geminiApiKey', value: geminiApiKey },
    ];
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
    <form onSubmit={handleSave} className="space-y-12 pb-32 p-6">
      {/* System Settings (no concurrent input here) */}
      <Card className="shadow-lg ">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl gap-2">
            <Settings className="h-7 w-7 text-primary" />
            System Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {/* No Max Concurrent Processors input here */}
        </CardContent>
      </Card>
      {/* AI Configuration (Gemini) */}
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
      {/* Webhook Automation (n8n) + Max Concurrent Processors */}
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
            <Label htmlFor="resume-processing-webhook">Resume Processing Webhook URL (Any Service)</Label>
            <Input id="resume-processing-webhook" type="url" placeholder="https://your-webhook-endpoint/receive-resume" value={resumeProcessingWebhookUrl} onChange={(e) => setResumeProcessingWebhookUrl(e.target.value)} className="mt-1" disabled={isSaving}/>
            <p className="text-xs text-muted-foreground mt-1">This URL will receive a POST request with the uploaded resume file (as FormData). You can use any compatible webhook service (n8n, Zapier, Make, custom API, etc.).</p>
          </div>
          <Separator />
          <div>
            <Label htmlFor="n8n-generic-pdf-webhook">New Candidate PDF Webhook URL</Label>
            <Input id="n8n-generic-pdf-webhook" type="url" placeholder="https://your-n8n-instance/webhook/new-candidate-pdf" value={n8nGenericPdfWebhookUrl} onChange={(e) => setN8nGenericPdfWebhookUrl(e.target.value)} className="mt-1" disabled={isSaving}/>
            <p className="text-xs text-muted-foreground mt-1">Used by &quot;Create via Resume (Automated)&quot; feature. The application sends the PDF file (as FormData) and optional target position info to this endpoint. This webhook should then call back to <code className='font-mono text-xs bg-muted px-1 rounded'>/api/n8n/create-candidate-with-matches</code>.</p>
          </div>
          <Separator />
          <div>
            <Label style={{ marginTop: 16, display: 'block' }}>Max Concurrent Processors</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={maxConcurrentProcessors}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxConcurrentProcessors(Number(e.target.value))}
              style={{ marginBottom: 16, width: 80 }}
            />
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
            <Input id="smtp-port" type="text" placeholder="587" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="mt-1" disabled={isSaving}/>
          </div>
          <div>
            <Label htmlFor="smtp-user">SMTP User</Label>
            <Input id="smtp-user" type="text" placeholder="user@example.com" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="mt-1" disabled={isSaving}/>
          </div>
          <div>
            <Label htmlFor="smtp-password">SMTP Password (set via env)</Label>
            <Input id="smtp-password" type="password" placeholder="Set via environment variable" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} className="mt-1" disabled readOnly/>
            <p className="text-xs text-muted-foreground mt-1">Password must be set as an environment variable on the server.</p>
          </div>
          <div>
            <Label htmlFor="smtp-secure">SMTP Secure</Label>
            <input id="smtp-secure" type="checkbox" checked={smtpSecure} onChange={(e) => setSmtpSecure(e.target.checked)} disabled={isSaving}/>
            <span className="ml-2 text-sm">Use TLS/SSL</span>
          </div>
          <div>
            <Label htmlFor="smtp-from-email">From Email</Label>
            <Input id="smtp-from-email" type="email" placeholder="noreply@example.com" value={smtpFromEmail} onChange={(e) => setSmtpFromEmail(e.target.value)} className="mt-1" disabled={isSaving}/>
          </div>
        </CardContent>
      </Card>
      <Button type="submit" disabled={isSaving} className="mt-8">
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? 'Saving...' : 'Save All Settings'}
      </Button>
    </form>
  );
} 