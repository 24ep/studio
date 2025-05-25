
"use client";
import { useState, useEffect, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Settings, Mail, Zap, UploadCloud, FileText, XCircle, Loader2 } from 'lucide-react'; 

const N8N_RESUME_WEBHOOK_URL_KEY = 'n8nResumeWebhookUrl'; // For candidate resumes (from /api/resumes/upload)
// N8N_GENERIC_PDF_WEBHOOK_URL is a server-side ENV VAR, not managed here.
const SMTP_HOST_KEY = 'smtpHost';
const SMTP_PORT_KEY = 'smtpPort';
const SMTP_USER_KEY = 'smtpUser';

export default function IntegrationsSettingsPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  // n8n for Candidate Resumes (from regular resume upload)
  const [resumeWebhookUrl, setResumeWebhookUrl] = useState('');
  
  // SMTP
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState(''); // Only for UI, not saved


  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const storedResumeWebhookUrl = localStorage.getItem(N8N_RESUME_WEBHOOK_URL_KEY);
      if (storedResumeWebhookUrl) setResumeWebhookUrl(storedResumeWebhookUrl);

      const storedSmtpHost = localStorage.getItem(SMTP_HOST_KEY);
      if (storedSmtpHost) setSmtpHost(storedSmtpHost);

      const storedSmtpPort = localStorage.getItem(SMTP_PORT_KEY);
      if (storedSmtpPort) setSmtpPort(storedSmtpPort);

      const storedSmtpUser = localStorage.getItem(SMTP_USER_KEY);
      if (storedSmtpUser) setSmtpUser(storedSmtpUser);
    }
  }, []);

  const handleSaveIntegrations = () => {
    if (!isClient) return;
    localStorage.setItem(N8N_RESUME_WEBHOOK_URL_KEY, resumeWebhookUrl);
    localStorage.setItem(SMTP_HOST_KEY, smtpHost);
    localStorage.setItem(SMTP_PORT_KEY, smtpPort);
    localStorage.setItem(SMTP_USER_KEY, smtpUser);
    
    toast({
      title: 'Client-Side Settings Saved',
      description: 'Your n8n (resume specific) and SMTP display settings have been updated locally in your browser.',
    });
  };


  if (!isClient) {
    return (
        <div className="space-y-8 max-w-xl mx-auto">
          {[1,2].map(i => ( // Reduced to 2 cards as one was removed
             <Card key={i} className="shadow-lg animate-pulse">
              <CardHeader>
                <div className="h-8 bg-muted rounded w-1/2 mb-1"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <div className="h-6 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
           <div className="flex justify-end pt-4">
                <div className="h-10 bg-muted rounded w-64 animate-pulse"></div>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-8 max-w-xl mx-auto">
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-6 w-6 text-orange-500" /> Workflow Automation (n8n for Candidate Resumes)
          </CardTitle>
          <CardDescription>Configure your n8n webhook for automated processing of resumes uploaded to **existing candidates**.</CardDescription>
        </CardHeader>
        <CardContent>
            <div>
              <Label htmlFor="n8n-resume-webhook-url">n8n Resume Webhook URL (Client Setting)</Label>
              <Input
                id="n8n-resume-webhook-url"
                type="url"
                placeholder="https://your-n8n-instance.com/webhook/..."
                value={resumeWebhookUrl}
                onChange={(e) => setResumeWebhookUrl(e.target.value)}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter the URL for your n8n webhook. This setting is saved in browser localStorage. 
                The server uses the `N8N_RESUME_WEBHOOK_URL` environment variable for processing resumes uploaded to specific candidates.
                For creating candidates from PDF via n8n (on Candidates page), the `N8N_GENERIC_PDF_WEBHOOK_URL` environment variable is used by the server.
              </p>
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-6 w-6 text-blue-500" /> SMTP Configuration
          </CardTitle>
          <CardDescription>Set up your SMTP server for sending application emails. (Client Settings for display/concept)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input
                id="smtp-host"
                type="text"
                placeholder="smtp.example.com"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Input
                id="smtp-port"
                type="number"
                placeholder="587"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="smtp-user">SMTP Username</Label>
              <Input
                id="smtp-user"
                type="text"
                placeholder="your-email@example.com"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="smtp-password">SMTP Password</Label>
              <Input
                id="smtp-password"
                type="password"
                placeholder="••••••••"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Note: Password is not saved in localStorage. Use environment variables for actual SMTP credentials on the server.
              </p>
            </div>
             <p className="text-sm text-muted-foreground pt-2">
                These client-side settings are for display/conceptual configuration. Actual email sending would use server-side environment variables.
            </p>
        </CardContent>
      </Card>
      <div className="flex justify-end pt-4">
          <Button onClick={handleSaveIntegrations} size="lg">
            <Save className="mr-2 h-4 w-4" /> Save Client-Side Settings
          </Button>
      </div>
    </div>
  );
}
