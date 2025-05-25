
"use client";
import { useState, useEffect, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Settings, Mail, Zap, UploadCloud, FileText, XCircle, Loader2 } from 'lucide-react'; 

const N8N_RESUME_WEBHOOK_URL_KEY = 'n8nResumeWebhookUrl'; // For candidate resumes
const SMTP_HOST_KEY = 'smtpHost';
const SMTP_PORT_KEY = 'smtpPort';
const SMTP_USER_KEY = 'smtpUser';

export default function IntegrationsSettingsPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  // n8n for Candidate Resumes
  const [resumeWebhookUrl, setResumeWebhookUrl] = useState('');
  
  // SMTP
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState(''); // Only for UI, not saved

  // Generic PDF to n8n
  const [genericPdfFile, setGenericPdfFile] = useState<File | null>(null);
  const [isUploadingToN8n, setIsUploadingToN8n] = useState(false);


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
      title: 'Integrations Saved',
      description: 'Your n8n (resume) and SMTP settings have been updated locally.',
    });
  };

  const handleGenericPdfFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            toast({ title: "File Too Large", description: "PDF file size should not exceed 10MB.", variant: "destructive" });
            setGenericPdfFile(null);
            event.target.value = ''; 
            return;
        }
        setGenericPdfFile(file);
      } else {
        toast({ title: "Invalid File Type", description: "Please select a PDF file.", variant: "destructive" });
        setGenericPdfFile(null);
        event.target.value = ''; 
      }
    } else {
      setGenericPdfFile(null);
    }
  };

  const removeGenericPdfFile = () => {
    setGenericPdfFile(null);
    const fileInput = document.getElementById('generic-pdf-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleUploadGenericPdfToN8n = async () => {
    if (!genericPdfFile) {
      toast({ title: "No PDF Selected", description: "Please select a PDF file to upload.", variant: "destructive" });
      return;
    }
    
    setIsUploadingToN8n(true);
    const formData = new FormData();
    formData.append('pdfFile', genericPdfFile);

    try {
      const response = await fetch('/api/n8n/webhook-proxy', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to send PDF to n8n. Status: ${response.status}`);
      }

      toast({
        title: "PDF Sent to n8n",
        description: result.message || `PDF "${genericPdfFile.name}" sent to n8n workflow.`,
      });
      removeGenericPdfFile(); 
    } catch (error) {
      console.error("Error sending PDF to n8n:", error);
      toast({
        title: "Upload Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsUploadingToN8n(false);
    }
  };


  if (!isClient) {
    return (
        <div className="space-y-8 max-w-xl mx-auto">
          {[1,2,3].map(i => (
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
                 {i === 2 && <div className="h-10 bg-muted rounded"></div>}
              </CardContent>
              { i !== 0 && 
                <CardFooter>
                  <div className="h-10 bg-muted rounded w-32"></div>
                </CardFooter>
              }
            </Card>
          ))}
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
          <CardDescription>Configure your n8n webhook for automated candidate resume processing (e.g., parsing).</CardDescription>
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
                Enter the URL for your n8n webhook. This setting is saved in browser localStorage. The server uses `N8N_RESUME_WEBHOOK_URL` environment variable for actual processing.
              </p>
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <UploadCloud className="mr-2 h-6 w-6 text-purple-500" /> General PDF to n8n Workflow
          </CardTitle>
          <CardDescription>Upload a generic PDF file to trigger a separate n8n workflow. (Requires Admin role)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="generic-pdf-upload">Select PDF File (Max 10MB)</Label>
            <Input
              id="generic-pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={handleGenericPdfFileChange}
              className="mt-1"
            />
          </div>
          {genericPdfFile && (
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
              <div className="flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{genericPdfFile.name}</span> 
                <span className="text-xs text-muted-foreground whitespace-nowrap">({(genericPdfFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={removeGenericPdfFile}>
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="sr-only">Remove file</span>
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            This uploads the PDF via a server proxy to the n8n webhook defined by the `N8N_GENERIC_PDF_WEBHOOK_URL` server environment variable.
          </p>
        </CardContent>
        <CardFooter>
            <Button 
              onClick={handleUploadGenericPdfToN8n} 
              disabled={!genericPdfFile || isUploadingToN8n}
            >
              {isUploadingToN8n ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              {isUploadingToN8n ? 'Uploading...' : 'Upload PDF to n8n'}
            </Button>
        </CardFooter>
      </Card>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-6 w-6 text-blue-500" /> SMTP Configuration
          </CardTitle>
          <CardDescription>Set up your SMTP server for sending application emails. (Client Settings)</CardDescription>
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
            <Save className="mr-2 h-4 w-4" /> Save Client-Side Integration Settings
          </Button>
      </div>
    </div>
  );
}
