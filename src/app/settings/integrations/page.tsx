
"use client";
import { useState, useEffect, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Settings, Mail, Zap, UploadCloud, FileText, XCircle, Loader2 } from 'lucide-react'; 
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';


// Removed N8N_RESUME_WEBHOOK_URL_KEY as it's now server-configured
const SMTP_HOST_KEY = 'smtpHost';
const SMTP_PORT_KEY = 'smtpPort';
const SMTP_USER_KEY = 'smtpUser';

export default function IntegrationsSettingsPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  // Removed resumeWebhookUrl state
  
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState(''); 


  useEffect(() => {
    setIsClient(true);
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: window.location.pathname });
    } else if (sessionStatus === 'authenticated') {
        if (typeof window !== 'undefined') {
            // Removed loading resumeWebhookUrl from localStorage

            const storedSmtpHost = localStorage.getItem(SMTP_HOST_KEY);
            if (storedSmtpHost) setSmtpHost(storedSmtpHost);

            const storedSmtpPort = localStorage.getItem(SMTP_PORT_KEY);
            if (storedSmtpPort) setSmtpPort(storedSmtpPort);

            const storedSmtpUser = localStorage.getItem(SMTP_USER_KEY);
            if (storedSmtpUser) setSmtpUser(storedSmtpUser);
        }
    }
  }, [sessionStatus, router]);

  const handleSaveIntegrations = () => {
    if (!isClient) return;
    // Removed saving resumeWebhookUrl to localStorage
    localStorage.setItem(SMTP_HOST_KEY, smtpHost);
    localStorage.setItem(SMTP_PORT_KEY, smtpPort);
    localStorage.setItem(SMTP_USER_KEY, smtpUser);
    
    toast({
      title: 'Client-Side Settings Saved',
      description: 'Your SMTP display settings have been updated locally in your browser.',
    });
  };


  if (sessionStatus === 'loading' || (sessionStatus === 'unauthenticated' && !router.asPath.startsWith('/auth/signin')) || !isClient) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="space-y-8 max-w-xl mx-auto">
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-6 w-6 text-orange-500" /> Workflow Automation (n8n)
          </CardTitle>
          <CardDescription>Configure n8n webhooks for automated processing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground">n8n Resume Webhook (for Existing Candidates)</h4>
              <p className="text-sm text-muted-foreground mt-1">
                This webhook is used for processing resumes uploaded to **existing candidates** (via the "Upload Resume" button on candidate profiles or lists).
                It is configured on the server using the <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">N8N_RESUME_WEBHOOK_URL</code> environment variable.
              </p>
            </div>
            <hr/>
            <div>
                <h4 className="font-medium text-foreground">n8n Generic PDF Webhook (for New Candidate Creation)</h4>
                <p className="text-sm text-muted-foreground mt-1">
                    This webhook is used by the "Create via Resume (n8n)" feature on the Candidates page to process a PDF and create a new candidate.
                    It is configured on the server using the <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">N8N_GENERIC_PDF_WEBHOOK_URL</code> environment variable.
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
            <Save className="mr-2 h-4 w-4" /> Save Client-Side SMTP Settings
          </Button>
      </div>
    </div>
  );
}

    