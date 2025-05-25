
"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Settings, Mail, Zap } from 'lucide-react'; // Zap for n8n

const N8N_WEBHOOK_URL_KEY = 'n8nWebhookUrl';
const SMTP_HOST_KEY = 'smtpHost';
const SMTP_PORT_KEY = 'smtpPort';
const SMTP_USER_KEY = 'smtpUser';

export default function IntegrationsSettingsPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  const [webhookUrl, setWebhookUrl] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState(''); // Only for UI, not saved

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const storedWebhookUrl = localStorage.getItem(N8N_WEBHOOK_URL_KEY);
      if (storedWebhookUrl) setWebhookUrl(storedWebhookUrl);

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
    localStorage.setItem(N8N_WEBHOOK_URL_KEY, webhookUrl);
    localStorage.setItem(SMTP_HOST_KEY, smtpHost);
    localStorage.setItem(SMTP_PORT_KEY, smtpPort);
    localStorage.setItem(SMTP_USER_KEY, smtpUser);
    
    toast({
      title: 'Integrations Saved',
      description: 'Your integration settings have been updated locally.',
    });
  };

  if (!isClient) {
    return (
        <div className="space-y-6">
          <Card className="w-full max-w-xl mx-auto shadow-lg animate-pulse">
            <CardHeader>
              <CardTitle className="h-8 bg-muted rounded"></CardTitle>
              <CardDescription className="h-4 bg-muted rounded mt-1"></CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <div className="h-6 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
              <div>
                <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-10 bg-muted rounded mb-4"></div>
                <div className="h-10 bg-muted rounded mb-4"></div>
                <div className="h-10 bg-muted rounded mb-4"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="h-10 bg-muted rounded w-32"></div>
            </CardFooter>
          </Card>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-6 w-6 text-primary" /> Integrations
          </CardTitle>
          <CardDescription>Manage connections to external services like n8n and SMTP for email. Settings are saved locally.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
              <Zap className="mr-2 h-5 w-5 text-orange-500" /> Workflow Automation (n8n)
            </h3>
            <div>
              <Label htmlFor="n8n-webhook-url">n8n Webhook URL</Label>
              <Input
                id="n8n-webhook-url"
                type="url"
                placeholder="https://your-n8n-instance.com/webhook/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter the URL for your n8n webhook to process resume uploads or other automations.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
              <Mail className="mr-2 h-5 w-5 text-blue-500" /> SMTP Configuration (Email Sending)
            </h3>
            <div className="space-y-4">
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
                  Note: Password is not saved in this prototype. Use environment variables in production.
                </p>
              </div>
            </div>
             <p className="text-sm text-muted-foreground mt-2">
                These settings are for sending emails (e.g., notifications). Use environment variables for secure storage in production.
              </p>
          </section>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveIntegrations}>
            <Save className="mr-2 h-4 w-4" /> Save Integrations
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

    