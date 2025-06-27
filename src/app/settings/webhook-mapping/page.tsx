// src/app/settings/webhook-mapping/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Save, SlidersHorizontal, Info, Loader2, ShieldAlert, ServerCrash, RefreshCw } from 'lucide-react';
import type { WebhookFieldMapping } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from 'react-hot-toast';

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
  { path: 'candidate_info.education', label: 'Education (Array)', type: 'array of objects', example: 'payload.educationHistory', defaultNotes: 'Source should be an array of education objects matching EducationEntry structure.' },
  { path: 'candidate_info.experience', label: 'Experience (Array)', type: 'array of objects', example: 'payload.workHistory', defaultNotes: 'Source should be an array of experience objects matching ExperienceEntry structure.' },
  { path: 'candidate_info.skills', label: 'Skills (Array)', type: 'array of objects', example: 'payload.skillSet', defaultNotes: 'Source should be an array of skill objects/groups matching SkillEntry structure.' },
  { path: 'candidate_info.job_suitable', label: 'Job Suitability (Array)', type: 'array of objects', example: 'payload.preferences.jobTypes', defaultNotes: 'Source should be an array of job suitability objects matching JobSuitableEntry structure.' },
  { path: 'jobs', label: 'Job Matches (Array)', type: 'array of AutomationJobMatch objects', example: 'payload.suggestedRoles', defaultNotes: 'Array of suggested job matches from processing, matching AutomationJobMatch structure.' },
  { path: 'job_applied.job_id', label: 'Applied Job - ID', type: 'string (UUID)', example: 'payload.application.jobReferenceID', defaultNotes: 'ID of the job applied for.' },
  { path: 'job_applied.job_title', label: 'Applied Job - Title', type: 'string', example: 'payload.application.jobTitle', defaultNotes: 'Title of the job applied for.' },
  { path: 'job_applied.fit_score', label: 'Applied Job - Fit Score', type: 'number', example: 'payload.application.matchScore', defaultNotes: 'Fit score for the applied job.' },
  { path: 'job_applied.justification', label: 'Applied Job - Justification (Array)', type: 'array of strings', example: 'payload.application.justificationText', defaultNotes: 'Array of strings justifying the match score.' },
  { path: 'targetPositionId', label: 'Target Position ID (Hint)', type: 'string (UUID)', example: 'payload.initialTarget.id', defaultNotes: 'Hint from uploader about target position ID.' },
  { path: 'targetPositionTitle', label: 'Target Position Title (Hint)', type: 'string', example: 'payload.initialTarget.title', defaultNotes: 'Hint from uploader about target position title.' },
  { path: 'targetPositionDescription', label: 'Target Position Description (Hint)', type: 'string', example: 'payload.initialTarget.description', defaultNotes: 'Hint from uploader about target position description.' },
  { path: 'targetPositionLevel', label: 'Target Position Level (Hint)', type: 'string', example: 'payload.initialTarget.level', defaultNotes: 'Hint from uploader about target position level.' },
];

interface GroupedMapping {
    groupName: string;
    description: string;
    attributes: WebhookFieldMapping[];
}

export default function WebhookMappingPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
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
        id: existingDbMapping?.id,
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
          return;
        }
        throw new Error(errorData.message);
      }
      const data: WebhookFieldMapping[] = await response.json();
      initializeMappings(data);
    } catch (error) {
      console.error("Error fetching webhook mappings:", error);
      setFetchError((error as Error).message);
      initializeMappings([]); 
      toast.error((error as Error).message);
    } finally {
      setIsLoadingData(false);
    }
  }, [sessionStatus, toast, initializeMappings]);

  useEffect(() => {
    setIsClient(true);
    if (sessionStatus === 'unauthenticated') {
      return;
    } else if (sessionStatus === 'authenticated') {
       if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('WEBHOOK_MAPPING_MANAGE')) {
        setFetchError("You do not have permission to manage webhook mappings.");
        setIsLoadingData(false);
        return;
      }
      fetchMappings();
    }
  }, [sessionStatus, session, fetchMappings]);

  useEffect(() => {
    if (fetchError) {
      toast.error(fetchError);
    }
  }, [fetchError, toast]);

  const handleMappingChange = (targetPath: string, field: 'sourcePath' | 'notes', value: string) => {
    setMappings(prevMappings => 
      prevMappings.map(mapping => 
        mapping.targetPath === targetPath 
          ? { ...mapping, [field]: value } 
          : mapping
      )
    );
  };
  
  const handleSaveConfiguration = async () => {
    if (!isClient) return;
    setIsSaving(true);
    try {
      const payloadToSave = mappings.map(m => ({
        targetPath: m.targetPath,
        sourcePath: m.sourcePath || null, 
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
      initializeMappings(result); 
      toast.success('Configuration Saved');
    } catch (error) {
      console.error("Error saving webhook mapping to server:", error);
      toast.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const groupedMappings: GroupedMapping[] = useMemo(() => {
    const groups: Record<string, GroupedMapping> = {
        'general': { groupName: 'General Information', description: "Core candidate identification and personal details.", attributes: [] },
        'resume_content': { groupName: 'Resume Content (Arrays)', description: "Fields that expect an array of objects, like education or work history.", attributes: [] },
        'job_matching': { groupName: 'Job Matching & Application', description: "Fields related to specific job matches or the applied-for job.", attributes: [] },
        'upload_context': { groupName: 'Upload Context (Hints)', description: "Optional hints provided by the uploader about the target position.", attributes: [] },
    };

    mappings.forEach(mapping => {
        const path = mapping.targetPath;
        if (path.startsWith('candidate_info.personal_info') || path.startsWith('candidate_info.contact_info') || path === 'candidate_info.cv_language') {
            groups['general'].attributes.push(mapping);
        } else if (['candidate_info.education', 'candidate_info.experience', 'candidate_info.skills', 'candidate_info.job_suitable'].includes(path)) {
            groups['resume_content'].attributes.push(mapping);
        } else if (path.startsWith('job_applied') || path === 'jobs') {
            groups['job_matching'].attributes.push(mapping);
        } else if (path.startsWith('targetPosition')) {
            groups['upload_context'].attributes.push(mapping);
        }
    });

    return Object.values(groups).filter(g => g.attributes.length > 0);
  }, [mappings]);
  
  if (sessionStatus === 'loading' || (isLoadingData && !fetchError && !isClient && mappings.length === 0)) {
    return ( <div className="flex h-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div> );
  }

  if (fetchError && !isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
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
    <div className="space-y-6 pb-32 p-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl gap-2">
            <SlidersHorizontal className="h-7 w-7 text-primary" />
            Webhook Field Mapping
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Configure how data from external webhook services maps to CandiTrack candidate attributes.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Alert variant="default" className="mb-6 bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="font-semibold text-blue-700 dark:text-blue-300">How This Works</AlertTitle>
              <AlertDescription>
                Enter the JSON path from your workflow&#39;s output (e.g., <code className="font-mono text-xs bg-blue-200 dark:bg-blue-800 px-1 rounded">data.profile.firstName</code>) into the &quot;Source JSON Path&quot; field.
                If a source path is left empty, that CandiTrack attribute will not be populated. For array fields, ensure the source path points to an array of objects with a compatible structure.
              </AlertDescription>
            </Alert>
            
            {isLoadingData && mappings.length === 0 ? (
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
              <Accordion type="multiple" defaultValue={groupedMappings.map(g => g.groupName)} className="w-full">
                {groupedMappings.map(group => (
                  <AccordionItem value={group.groupName} key={group.groupName}>
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">{group.groupName}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground mb-4">{group.description}</p>
                      <div className="space-y-4">
                        {group.attributes.map((mapping, index) => {
                           const targetAttrInfo = TARGET_CANDIDATE_ATTRIBUTES_CONFIG.find(attr => attr.path === mapping.targetPath);
                           return (
                            <div key={mapping.targetPath} className="p-4 border rounded-md bg-muted/20">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-2">
                                  <div>
                                    <Label htmlFor={`sourcePath-${mapping.targetPath}`}>Target: <span className="font-semibold text-foreground">{targetAttrInfo?.label || mapping.targetPath}</span></Label>
                                    <div className="text-xs text-muted-foreground mb-1">Path: <code className="text-xs bg-muted/50 px-1 rounded">{mapping.targetPath}</code></div>
                                    <Input 
                                        id={`sourcePath-${mapping.targetPath}`} 
                                        value={mapping.sourcePath || ''} 
                                        onChange={(e) => handleMappingChange(mapping.targetPath, 'sourcePath', e.target.value)}
                                        placeholder={targetAttrInfo?.example || "e.g., data.profile.firstName"}
                                        className="text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`notes-${mapping.targetPath}`}>Notes</Label>
                                    <Textarea
                                        id={`notes-${mapping.targetPath}`}
                                        value={mapping.notes || ''}
                                        onChange={(e) => handleMappingChange(mapping.targetPath, 'notes', e.target.value)}
                                        placeholder="Optional notes or details about this mapping"
                                        className="text-sm min-h-[60px] mt-1"
                                        rows={2}
                                    />
                                  </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
        </CardContent>
      </Card>

      {/* Floating Save/Reset Bar */}
      <div className="fixed bottom-6 right-6 z-30 bg-background/95 border shadow-lg rounded-xl flex flex-row gap-4 py-3 px-6" style={{boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)'}}>
        <Button onClick={handleSaveConfiguration} disabled={isSaving || isLoadingData || !!fetchError || mappings.length === 0} className="btn-primary-gradient flex items-center gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save All
        </Button>
        <Button variant="outline" onClick={fetchMappings} disabled={isSaving} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Reset
        </Button>
      </div>
    </div>
  );
}
