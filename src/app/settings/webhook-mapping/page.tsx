
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
import { Save, SlidersHorizontal, Info, Trash2, PlusCircle, Loader2, ShieldAlert, ServerCrash, RefreshCw } from 'lucide-react';
import type { WebhookFieldMapping } from '@/lib/types'; // Server-side type

// Define the target candidate attributes we can map to.
// This list should reflect the fields processable by the n8n/create-candidate-with-matches API's Zod schema.
// Path uses dot notation for nesting.
// This acts as the "master list" of what target paths are configurable.
const TARGET_CANDIDATE_ATTRIBUTES_CONFIG: { path: string; label: string; type: string; example?: string, defaultNotes?: string }[] = [
  { path: 'candidate_info.cv_language', label: 'CV Language', type: 'string', example: 'payload.language', defaultNotes: 'Language code of the resume (e.g., EN, TH).' },
  { path: 'candidate_info.personal_info.title_honorific', label: 'Personal - Title', type: 'string', example: 'payload.profile.title', defaultNotes: 'E.g., Mr., Ms., Dr.' },
  { path: 'candidate_info.personal_info.firstname', label: 'Personal - First Name', type: 'string', example: 'payload.profile.firstName', defaultNotes: 'Candidate\'s first name.' },
  { path: 'candidate_info.personal_info.lastname', label: 'Personal - Last Name', type: 'string', example: 'payload.profile.lastName', defaultNotes: 'Candidate\'s last name.' },
  { path: 'candidate_info.personal_info.nickname', label: 'Personal - Nickname', type: 'string', example: 'payload.profile.nick', defaultNotes: 'Optional nickname.' },
  { path: 'candidate_info.personal_info.location', label: 'Personal - Location', type: 'string', example: 'payload.address.full', defaultNotes: 'City, Country, etc.' },
  { path: 'candidate_info.personal_info.introduction_aboutme', label: 'Personal - About Me', type: 'string (multiline)', example: 'payload.profile.summary', defaultNotes: 'Brief introduction or summary.' },
  { path: 'candidate_info.contact_info.email', label: 'Contact - Email', type: 'string', example: 'payload.contact.emailAddress', defaultNotes: 'Primary email.' },
  { path: 'candidate_info.contact_info.phone', label: 'Contact - Phone', type: 'string', example: 'payload.contact.phoneNumber', defaultNotes: 'Primary phone number.' },
  { path: 'candidate_info.education', label: 'Education (Array)', type: 'array of objects', example: 'payload.educationHistory', defaultNotes: 'Source should be an array of education objects.' },
  { path: 'candidate_info.experience', label: 'Experience (Array)', type: 'array of objects', example: 'payload.workHistory', defaultNotes: 'Source should be an array of experience objects.' },
  { path: 'candidate_info.skills', label: 'Skills (Array)', type: 'array of objects', example: 'payload.skillSet', defaultNotes: 'Source should be an array of skill objects/groups.' },
  { path: 'candidate_info.job_suitable', label: 'Job Suitability (Array)', type: 'array of objects', example: 'payload.preferences.jobTypes', defaultNotes: 'Source should be an array of job suitability objects.' },
  { path: 'jobs', label: 'Job Matches (Array)', type: 'array of N8NJobMatch objects', example: 'payload.suggestedRoles', defaultNotes: 'Array of suggested job matches from processing.' },
  { path: 'job_applied.job_id', label: 'Applied Job - ID', type: 'string (UUID)', example: 'payload.application.jobReferenceID', defaultNotes: 'ID of the job applied for.' },
  { path: 'job_applied.job_title', label: 'Applied Job - Title', type: 'string', example: 'payload.application.jobTitle', defaultNotes: 'Title of the job applied for.' },
  { path: 'job_applied.fit_score', label: 'Applied Job - Fit Score', type: 'number', example: 'payload.application.matchScore', defaultNotes: 'Fit score for the applied job.' },
  { path: 'job_applied.justification', label: 'Applied Job - Justification (Array)', type: 'array of strings', example: 'payload.application.justificationText', defaultNotes: 'Justification for the match score.' },
  { path: 'targetPositionId', label: 'Target Position ID (Hint)', type: 'string (UUID)', example: 'payload.initialTarget.id', defaultNotes: 'Hint from uploader about target position ID.' },
  { path: 'targetPositionTitle', label: 'Target Position Title (Hint)', type: 'string', example: 'payload.initialTarget.title', defaultNotes: 'Hint from uploader about target position title.' },
  { path: 'targetPositionDescription', label: 'Target Position Description (Hint)', type: 'string', example: 'payload.initialTarget.description', defaultNotes: 'Hint from uploader about target position description.' },
  { path: 'targetPositionLevel', label: 'Target Position Level (Hint)', type: 'string', example: 'payload.initialTarget.level', defaultNotes: 'Hint from uploader about target position level.' },
];


export default function WebhookMappingPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const [isClient, setIsClient] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [mappings, setMappings] = useState<WebhookFieldMapping[]>([]);

  const initializeMappings = useCallback((dbMappings: WebhookFieldMapping[]) => {
    const dbMappingsMap = new Map(dbMappings.map(m => [m.targetPath, m]));
    const initialised = TARGET_CANDIDATE_ATTRIBUTES_CONFIG.map(attrConfig => {
      const existingDbMapping = dbMappingsMap.get(attrConfig.path);
      return {
        id: existingDbMapping?.id, // Keep DB id if exists
        targetPath: attrConfig.path,
        sourcePath: existingDbMapping?.sourcePath || '',
        notes: existingDbMapping?.notes || attrConfig.defaultNotes || '',
      };
    });
    setMappings(initialised);
  }, []);


  const fetchMappings = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;
    setIsLoadingData(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/settings/webhook-mappings');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch mappings' }));
        if (response.status === 401 || response.status === 403) {
          signIn(undefined, { callbackUrl: pathname });
          return;
        }
        throw new Error(errorData.message);
      }
      const data: WebhookFieldMapping[] = await response.json();
      initializeMappings(data);
    } catch (error) {
      console.error("Error fetching webhook mappings:", error);
      setFetchError((error as Error).message);
      initializeMappings([]); // Initialize with empty source paths if fetch fails
      toast({title: "Error Loading Mappings", description: (error as Error).message, variant: "destructive"});
    } finally {
      setIsLoadingData(false);
    }
  }, [sessionStatus, pathname, signIn, toast, initializeMappings]);

  useEffect(() => {
    setIsClient(true);
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
       if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('WEBHOOK_MAPPING_MANAGE')) {
        setFetchError("You do not have permission to manage webhook mappings.");
        setIsLoadingData(false);
        return;
      }
      fetchMappings();
    }
  }, [sessionStatus, session, pathname, signIn, fetchMappings]);


  const handleMappingChange = (index: number, field: 'sourcePath' | 'notes', value: string) => {
    const newMappings = [...mappings];
    // Ensure the object exists before trying to set a property on it
    if (!newMappings[index]) {
        // This case should ideally not happen if mappings are initialized correctly
        console.error(`Attempted to update non-existent mapping at index ${index}`);
        return;
    }
    newMappings[index] = { ...newMappings[index], [field]: value };
    setMappings(newMappings);
  };
  
  const handleSaveConfiguration = async () => {
    if (!isClient) return;
    setIsSaving(true);
    try {
      // Filter out mappings where sourcePath is empty, as they don't need to be saved if they mean "no mapping"
      // However, API currently expects all target paths. If sourcePath is empty, it means unmapped.
      const payloadToSave = mappings.map(m => ({
        targetPath: m.targetPath,
        sourcePath: m.sourcePath || null, // Send null if empty string for DB consistency
        notes: m.notes || null,
      }));

      const response = await fetch('/api/settings/webhook-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadToSave),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save mappings');
      }
      initializeMappings(result); // Re-initialize with data from server (includes IDs, createdAt etc.)
      toast({ title: 'Configuration Saved', description: 'Webhook payload mapping configuration saved to the server.' });
    } catch (error) {
      console.error("Error saving webhook mapping to server:", error);
      toast({title: "Error Saving", description: (error as Error).message, variant: "destructive"});
    } finally {
      setIsSaving(false);
    }
  };
  
  if (sessionStatus === 'loading' || (isLoadingData && !fetchError && !isClient)) {
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
        <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient mr-2">Go to Dashboard</Button>
        {fetchError !== "You do not have permission to manage webhook mappings." && 
            <Button onClick={fetchMappings} variant="outline"><RefreshCw className="mr-2 h-4 w-4"/>Try Again</Button>
        }
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><SlidersHorizontal className="mr-2 h-6 w-6 text-primary"/>Webhook Payload Mapping</CardTitle>
          <CardDescription>
            Define how incoming JSON fields from your automated workflow (e.g., n8n) map to the CandiTrack candidate attributes for the 
            <code>/api/n8n/create-candidate-with-matches</code> endpoint. This configuration is saved on the server.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Alert variant="default" className="mb-6 bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="font-semibold text-blue-700 dark:text-blue-300">How This Works</AlertTitle>
              <AlertDescription>
                The CandiTrack API (<code>/api/n8n/create-candidate-with-matches</code>) will use these server-side mappings to transform the JSON payload it receives from your workflow.
                Enter the JSON path from your workflow's output (e.g., <code className="font-mono text-xs bg-blue-200 dark:bg-blue-800 px-1 rounded">data.profile.firstName</code>) into the "Source JSON Path" field for each corresponding CandiTrack attribute.
                If a "Source JSON Path" is left empty, that CandiTrack attribute will not be populated from the webhook for that field.
              </AlertDescription>
            </Alert>
            
            <div className="text-sm font-medium text-muted-foreground mb-2">Field Mappings:</div>
            {isLoadingData ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2 text-muted-foreground">Loading mapping configuration...</p>
                </div>
            ) : mappings.length === 0 && !fetchError ? (
                 <div className="flex flex-col items-center justify-center py-10 text-center">
                    <SlidersHorizontal className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-2">No mapping configuration found or initialized.</p>
                    <p className="text-xs text-muted-foreground mb-4">Default target attributes will be shown once loaded or after first save.</p>
                    <Button onClick={fetchMappings} variant="outline"><RefreshCw className="mr-2 h-4 w-4"/>Reload Configuration</Button>
                </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 border rounded-md p-3 bg-muted/20">
                  {mappings.map((mapping, index) => {
                      const targetAttrInfo = TARGET_CANDIDATE_ATTRIBUTES_CONFIG.find(attr => attr.path === mapping.targetPath);
                      return (
                      <Card key={mapping.targetPath} className="p-3 shadow-sm bg-card"> {/* Use targetPath for key for stability */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                              <div>
                                  <Label htmlFor={`targetPath-${index}`} className="text-xs font-semibold">Target CandiTrack Attribute</Label>
                                  <Input 
                                      id={`targetPath-${index}`} 
                                      value={targetAttrInfo?.label || mapping.targetPath} 
                                      disabled 
                                      className="mt-1 text-xs bg-muted/50"
                                  />
                                  <p className="text-xs text-muted-foreground mt-0.5">Path: <code className="text-xs bg-muted/50 px-1 rounded">{mapping.targetPath}</code> (Type: {targetAttrInfo?.type || 'unknown'})</p>
                              </div>
                              <div>
                                  <Label htmlFor={`sourcePath-${index}`} className="text-xs font-semibold">Source JSON Path (from your Workflow)</Label>
                                  <Input 
                                      id={`sourcePath-${index}`} 
                                      value={mapping.sourcePath || ''} 
                                      onChange={(e) => handleMappingChange(index, 'sourcePath', e.target.value)}
                                      placeholder={targetAttrInfo?.example || "e.g., data.profile.firstName"}
                                      className="mt-1 text-xs"
                                  />
                              </div>
                          </div>
                          <div className="mt-2">
                              <Label htmlFor={`notes-${index}`} className="text-xs font-semibold">Notes/Details</Label>
                              <Textarea
                                  id={`notes-${index}`}
                                  value={mapping.notes || ''}
                                  onChange={(e) => handleMappingChange(index, 'notes', e.target.value)}
                                  placeholder="Optional notes or details about this mapping"
                                  className="mt-1 text-xs min-h-[40px]"
                                  rows={2}
                              />
                          </div>
                      </Card>
                  )})}
              </div>
            )}
        </CardContent>
      </Card>
      
      <div className="flex justify-end mt-6">
        <Button onClick={handleSaveConfiguration} size="lg" className="btn-primary-gradient" disabled={isSaving || isLoadingData || !!fetchError}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save Mapping Configuration'}
        </Button>
      </div>
    </div>
  );
}

