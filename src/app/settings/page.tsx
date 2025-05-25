
"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Settings } from 'lucide-react';

const N8N_WEBHOOK_URL_KEY = 'n8nWebhookUrl';

export default function SettingsPage() {
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Ensure localStorage is accessed only on the client
    const storedUrl = localStorage.getItem(N8N_WEBHOOK_URL_KEY);
    if (storedUrl) {
      setWebhookUrl(storedUrl);
    }
  }, []);

  const handleSave = () => {
    if (!isClient) return;
    localStorage.setItem(N8N_WEBHOOK_URL_KEY, webhookUrl);
    toast({
      title: 'Settings Saved',
      description: 'n8n webhook URL has been updated.',
    });
  };

  if (!isClient) {
    // You can return a loading state or null if preferred for SSR
    return (
        <div className="space-y-6">
          <Card className="w-full max-w-2xl mx-auto shadow-lg animate-pulse">
            <CardHeader>
              <CardTitle className="h-8 bg-muted rounded"></CardTitle>
              <CardDescription className="h-4 bg-muted rounded mt-1"></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-6 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4 mt-1"></div>
            </CardContent>
            <CardFooter>
              <div className="h-10 bg-muted rounded w-32"></div>
            </CardFooter>
          </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-6 w-6 text-primary" /> Application Settings
          </CardTitle>
          <CardDescription>Configure integrations and other application settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              Enter the full URL for your n8n webhook to process resume uploads.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Save Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
