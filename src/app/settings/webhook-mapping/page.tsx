
// src/app/settings/webhook-mapping/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Save, SlidersHorizontal, Info, Trash2, PlusCircle, Loader2, ShieldAlert } from 'lucide-react';
import type { WebhookMappingConfiguration, WebhookFieldMapping, ModelAttributeDefinition } from '@/lib/types';

const WEBHOOK_MAPPING_CONFIG_KEY = 'webhookMappingConfiguration_v1';

// Define the target candidate attributes we can map to.
// This list should reflect the fields processable by the n8n/create-candidate-with-matches API's Zod schema.
// Path uses dot notation for nesting.
const TARGET_CANDIDATE_ATTRIBUTES: { path: string; label: string; type: string; example?: string }[] = [
  // candidate_info section
  { path: 'candidate_info.cv_language', label: 'CV Language', type: 'string', example: 'EN' },
  { path: 'candidate_info.personal_info.title_honorific', label: 'Personal - Title', type: 'string', example: 'Mr.' },
  { path: 'candidate_info.personal_info.firstname', label: 'Personal - First Name', type: 'string', example: 'John' },
  { path: 'candidate_info.personal_info.lastname', label: 'Personal - Last Name', type: 'string', example: 'Doe' },
  { path: 'candidate_info.personal_info.nickname', label: 'Personal - Nickname', type: 'string', example: 'Johnny' },
  { path: 'candidate_info.personal_info.location', label: 'Personal - Location', type: 'string', example: 'New York, USA' },
  { path: 'candidate_info.personal_info.introduction_aboutme', label: 'Personal - About Me', type: 'string (multiline)', example: 'Experienced developer...' },
  { path: 'candidate_info.contact_info.email', label: 'Contact - Email', type: 'string', example: 'john.doe@example.com' },
  { path: 'candidate_info.contact_info.phone', label: 'Contact - Phone', type: 'string', example: '+1-555-1234' },
  // Arrays need special handling - user maps to the array, n8n workflow must format the array items.
  // Or user maps individual items if the source provides them flatly.
  // For now, let's assume the user maps to the top-level array path and n8n sends a pre-formatted array.
  { path: 'candidate_info.education', label: 'Education (Array)', type: 'array of objects', example: '[{\"university\":\"State U\", \"major\":\"CS\"}]' },
  { path: 'candidate_info.experience', label: 'Experience (Array)', type: 'array of objects', example: '[{\"company\":\"Tech Corp\", \"position\":\"Dev\"}]' },
  { path: 'candidate_info.skills', label: 'Skills (Array)', type: 'array of objects', example: '[{\"segment_skill\":\"Programming\", \"skill\":[\"JS\",\"Python\"]}]' },
  { path: 'candidate_info.job_suitable', label: 'Job Suitability (Array)', type: 'array of objects', example: '[{\"suitable_career\":\"Dev\", \"suitable_job_level\":\"Senior\"}]' },
  // jobs array (n8n suggested matches)
  { path: 'jobs', label: 'Job Matches (Array)', type: 'array of N8NJobMatch objects', example: '[{\"job_title\":\"SE\", \"fit_score\":90}]' },
  // job_applied object (the job this resume was for, if applicable)
  { path: 'job_applied.job_id', label: 'Applied Job - ID', type: 'string (UUID)', example: 'uuid-of-job' },
  { path: 'job_applied.job_title', label: 'Applied Job - Title', type: 'string', example: 'Senior Developer' },
  { path: 'job_applied.fit_score', label: 'Applied Job - Fit Score', type: 'number', example: '85' },
  { path: 'job_applied.match_reasons', label: 'Applied Job - Match Reasons (Array)', type: 'array of strings', example: '[\"Skill X\", \"Experience Y\"]' },
  // Top-level target position hints (optional, can be passed by initial uploader)
  { path: 'targetPositionId', label: 'Target Position ID (Hint)', type: 'string (UUID)', example: 'uuid-of-target-job' },
  { path: 'targetPositionTitle', label: 'Target Position Title (Hint)', type: 'string', example: 'Specific Role Name' },
  { path: 'targetPositionDescription', label: 'Target Position Description (Hint)', type: 'string', example: 'Detailed description for matching...' },
  { path: 'targetPositionLevel', label: 'Target Position Level (Hint)', type: 'string', example: 'Senior' },
];


export default function WebhookMappingPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [config, setConfig] = useState<WebhookMappingConfiguration>({
    webhookUrlName: 'Default Candidate Creation Webhook',
    mappings: TARGET_CANDIDATE_ATTRIBUTES.map(attr => ({
      targetPath: attr.path,
      sourcePath: '', // User will fill this
      notes: attr.example ? `E.g., map to ${attr.example}` : `Map to your webhook's source for ${attr.label}`
    }))
  });

  useEffect(() => {
    setIsClient(true);
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
       if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('WEBHOOK_MAPPING_MANAGE')) {
        setFetchError("You do not have permission to manage webhook mappings.");
        setIsLoading(false);
        return;
      }
      try {
        const storedConfig = localStorage.getItem(WEBHOOK_MAPPING_CONFIG_KEY);
        if (storedConfig) {
          const parsedConfig = JSON.parse(storedConfig) as WebhookMappingConfiguration;
          // Ensure all target paths are present, add new ones with empty source if schema changed
          const updatedMappings = TARGET_CANDIDATE_ATTRIBUTES.map(targetAttr => {
            const existingMapping = parsedConfig.mappings.find(m => m.targetPath === targetAttr.path);
            return existingMapping || { 
              targetPath: targetAttr.path, 
              sourcePath: '', 
              notes: targetAttr.example ? `E.g., map to ${targetAttr.example}` : `Map to your webhook's source for ${targetAttr.label}`
            };
          });
          setConfig({ ...parsedConfig, mappings: updatedMappings });
        } else {
           // Initialize with default if nothing stored
          setConfig({
            webhookUrlName: 'Default Candidate Creation Webhook',
            mappings: TARGET_CANDIDATE_ATTRIBUTES.map(attr => ({
              targetPath: attr.path,
              sourcePath: '',
              notes: attr.example ? `E.g., map to ${attr.example}` : `Map to your webhook's source for ${attr.label}`
            }))
          });
        }
      } catch (error) {
        console.error("Error loading webhook mapping from localStorage:", error);
        toast({title: "Error", description: "Could not load saved webhook mapping.", variant: "destructive"});
      }
      setIsLoading(false);
    }
  }, [sessionStatus, session, pathname, signIn, toast]);

  const handleMappingChange = (index: number, field: keyof WebhookFieldMapping, value: string) => {
    const newMappings = [...config.mappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    setConfig(prev => ({ ...prev, mappings: newMappings }));
  };
  
  // Add/Remove mapping functions are not strictly needed if we base it on TARGET_CANDIDATE_ATTRIBUTES
  // But if we allow fully custom target paths, they would be. For now, let's stick to predefined target paths.

  const handleSaveConfiguration = () => {
    if (!isClient) return;
    try {
      localStorage.setItem(WEBHOOK_MAPPING_CONFIG_KEY, JSON.stringify(config));
      toast({ title: 'Configuration Saved', description: 'Webhook payload mapping configuration saved locally for your reference.' });
    } catch (error) {
      console.error("Error saving webhook mapping to localStorage:", error);
      toast({title: "Error Saving", description: "Could not save webhook mapping.", variant: "destructive"});
    }
  };

  if (sessionStatus === 'loading' || (isLoading && !fetchError)) {
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
        <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient">Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><SlidersHorizontal className="mr-2 h-6 w-6 text-primary"/>Webhook Payload Mapping</CardTitle>
          <CardDescription>
            Configure how incoming JSON fields from your automated workflow (e.g., n8n) map to the CandiTrack candidate attributes for the 
            <code>/api/n8n/create-candidate-with-matches</code> endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Alert variant="default" className="mb-6 bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="font-semibold text-blue-700 dark:text-blue-300">Important Note</AlertTitle>
              <AlertDescription>
                These mappings are saved in your browser's local storage for your reference.
                You must configure your external workflow (e.g., n8n) to send data in a structure that ultimately matches what the CandiTrack API
                (<code>/api/n8n/create-candidate-with-matches</code>) expects after its internal parsing logic, or use these mappings to transform your workflow's output before sending it.
                The API currently expects the payload as defined by its internal Zod schema (see API docs or code for details).
              </AlertDescription>
            </Alert>

            <div className="space-y-2 mb-4">
                <Label htmlFor="webhookName">Configuration Name</Label>
                <Input 
                    id="webhookName" 
                    value={config.webhookUrlName} 
                    onChange={(e) => setConfig(prev => ({...prev, webhookUrlName: e.target.value}))}
                    placeholder="e.g., Default Candidate Creation Webhook"
                />
            </div>
            
            <div className="text-sm font-medium text-muted-foreground mb-2">Field Mappings:</div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 border rounded-md p-3 bg-muted/20">
                {config.mappings.map((mapping, index) => {
                    const targetAttrInfo = TARGET_CANDIDATE_ATTRIBUTES.find(attr => attr.path === mapping.targetPath);
                    return (
                    <Card key={index} className="p-3 shadow-sm bg-card">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                            <div>
                                <Label htmlFor={`targetPath-${index}`} className="text-xs font-semibold">Target CandiTrack Attribute</Label>
                                <Input 
                                    id={`targetPath-${index}`} 
                                    value={targetAttrInfo?.label || mapping.targetPath} 
                                    disabled 
                                    className="mt-1 text-xs bg-muted/50"
                                />
                                <p className="text-xs text-muted-foreground mt-0.5">Path: <code>{mapping.targetPath}</code> (Type: {targetAttrInfo?.type || 'unknown'})</p>
                            </div>
                            <div>
                                <Label htmlFor={`sourcePath-${index}`} className="text-xs font-semibold">Source JSON Path (from your Webhook)</Label>
                                <Input 
                                    id={`sourcePath-${index}`} 
                                    value={mapping.sourcePath} 
                                    onChange={(e) => handleMappingChange(index, 'sourcePath', e.target.value)}
                                    placeholder="e.g., data.profile.firstName"
                                    className="mt-1 text-xs"
                                />
                            </div>
                        </div>
                        <div className="mt-2">
                            <Label htmlFor={`notes-${index}`} className="text-xs font-semibold">Notes/Example</Label>
                            <Textarea
                                id={`notes-${index}`}
                                value={mapping.notes || ''}
                                onChange={(e) => handleMappingChange(index, 'notes', e.target.value)}
                                placeholder="Optional notes or examples"
                                className="mt-1 text-xs min-h-[40px]"
                                rows={2}
                            />
                        </div>
                    </Card>
                )})}
            </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end mt-6">
        <Button onClick={handleSaveConfiguration} size="lg" className="btn-primary-gradient">
          <Save className="mr-2 h-4 w-4" /> Save Mapping Configuration (Local)
        </Button>
      </div>
    </div>
  );
}
