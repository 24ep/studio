
// src/app/settings/data-models/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; 
import { useToast } from '@/hooks/use-toast';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Save, DatabaseZap, Info, ServerCrash, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
import type { UserDataModelPreference, UIDisplayPreference, ModelAttributeDefinition } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

const UI_DISPLAY_PREFERENCES: UIDisplayPreference[] = ["Standard", "Emphasized", "Hidden"];

const CANDIDATE_ATTRIBUTES: ModelAttributeDefinition[] = [
  { key: 'id', label: 'ID', type: 'string (UUID)', description: 'Unique identifier for the candidate.' },
  { key: 'name', label: 'Full Name', type: 'string', description: 'Full name of the candidate.' },
  { key: 'email', label: 'Email', type: 'string', description: 'Primary email address.' },
  { key: 'phone', label: 'Phone', type: 'string', description: 'Contact phone number.' },
  { key: 'avatarUrl', label: 'Avatar URL', type: 'string', description: 'URL to the candidate\'s profile picture.' },
  { key: 'resumePath', label: 'Resume File Path', type: 'string', description: 'Path to the stored resume file in MinIO.' },
  { key: 'positionId', label: 'Applied Position ID', type: 'string (UUID)', description: 'ID of the position the candidate applied for.' },
  { key: 'fitScore', label: 'Fit Score', type: 'number', description: 'Calculated score indicating suitability for the applied position (0-100).' },
  { key: 'status', label: 'Current Status', type: 'string', description: 'Current stage in the recruitment pipeline (e.g., Applied, Screening).' },
  { key: 'applicationDate', label: 'Application Date', type: 'date', description: 'Date the candidate applied.' },
  { key: 'recruiterId', label: 'Assigned Recruiter ID', type: 'string (UUID)', description: 'ID of the recruiter assigned to this candidate.' },
  { key: 'parsedData', label: 'Parsed Resume Data', type: 'object', description: 'Structured data extracted from the resume.', subAttributes: [
    { key: 'parsedData.cv_language', label: 'CV Language', type: 'string', description: 'Language of the resume.'},
    { key: 'parsedData.personal_info', label: 'Personal Info', type: 'object', subAttributes: [
      { key: 'parsedData.personal_info.firstname', label: 'First Name', type: 'string'},
      { key: 'parsedData.personal_info.lastname', label: 'Last Name', type: 'string'},
      { key: 'parsedData.personal_info.title_honorific', label: 'Title/Honorific', type: 'string'},
      { key: 'parsedData.personal_info.nickname', label: 'Nickname', type: 'string'},
      { key: 'parsedData.personal_info.location', label: 'Location', type: 'string'},
      { key: 'parsedData.personal_info.introduction_aboutme', label: 'About Me', type: 'string (multiline)'},
      { key: 'parsedData.personal_info.avatar_url', label: 'Avatar URL (from CV)', type: 'string (url)'},
    ]},
    { key: 'parsedData.contact_info', label: 'Contact Info (from CV)', type: 'object', subAttributes: [
      { key: 'parsedData.contact_info.email', label: 'Email (from CV)', type: 'string'},
      { key: 'parsedData.contact_info.phone', label: 'Phone (from CV)', type: 'string'},
    ]},
    { key: 'parsedData.education', label: 'Education History', type: 'array', arrayItemType: 'EducationEntry object', description: 'List of educational qualifications.' },
    { key: 'parsedData.experience', label: 'Work Experience', type: 'array', arrayItemType: 'ExperienceEntry object', description: 'List of previous jobs.' },
    { key: 'parsedData.skills', label: 'Skills', type: 'array', arrayItemType: 'SkillEntry object', description: 'List of skills.' },
    { key: 'parsedData.job_suitable', label: 'Job Suitability', type: 'array', arrayItemType: 'JobSuitableEntry object', description: 'Information on suitable job types.' },
    { 
      key: 'parsedData.associatedMatchDetails', 
      label: 'Primary Matched Job Details', 
      type: 'object', 
      description: 'Details of the job the candidate was primarily matched/applied to by automated processing.',
      subAttributes: [
        { key: 'parsedData.associatedMatchDetails.jobTitle', label: 'Matched Job Title', type: 'string', description: 'Title of the matched job.'},
        { key: 'parsedData.associatedMatchDetails.fitScore', label: 'Matched Fit Score', type: 'number', description: 'Fit score for this specific match.'},
        { key: 'parsedData.associatedMatchDetails.reasons', label: 'Match Reasons', type: 'array of strings', description: 'Reasons for this match.'},
        { key: 'parsedData.associatedMatchDetails.n8nJobId', label: 'Matched Job n8n ID', type: 'string', description: 'ID of the job from the n8n matching process, if available.'},
      ]
    },
    { key: 'parsedData.job_matches', label: 'All Suggested Job Matches', type: 'array', arrayItemType: 'N8NJobMatch object', description: 'Full list of job suggestions from automated processing.'},
  ]},
  { key: 'transitionHistory', label: 'Transition History', type: 'array', arrayItemType: 'TransitionRecord object', description: 'Log of status changes.' },
  { key: 'custom_attributes', label: 'Custom Attributes', type: 'object', description: 'User-defined custom fields and their values.'},
  { key: 'createdAt', label: 'Created At', type: 'date', description: 'Timestamp of creation.' },
  { key: 'updatedAt', label: 'Last Updated At', type: 'date', description: 'Timestamp of last update.' },
];

const POSITION_ATTRIBUTES: ModelAttributeDefinition[] = [
  { key: 'id', label: 'ID', type: 'string (UUID)', description: 'Unique identifier for the position.' },
  { key: 'title', label: 'Title', type: 'string', description: 'Job title.' },
  { key: 'department', label: 'Department', type: 'string', description: 'Department the position belongs to.' },
  { key: 'description', label: 'Description', type: 'string (multiline)', description: 'Detailed job description.' },
  { key: 'isOpen', label: 'Is Open', type: 'boolean', description: 'Whether the position is currently open for applications.' },
  { key: 'position_level', label: 'Position Level', type: 'string', description: 'Seniority level (e.g., Senior, Mid-Level).' },
  { key: 'custom_attributes', label: 'Custom Attributes', type: 'object', description: 'User-defined custom fields and their values.'},
  { key: 'createdAt', label: 'Created At', type: 'date', description: 'Timestamp of creation.' },
  { key: 'updatedAt', label: 'Last Updated At', type: 'date', description: 'Timestamp of last update.' },
];

const AttributeRow: React.FC<{
  attr: ModelAttributeDefinition;
  preferences: Record<string, Partial<Pick<UserDataModelPreference, 'uiPreference' | 'customNote'>>>;
  onPreferenceChange: (attrKey: string, prefType: 'uiPreference' | 'customNote', value: string) => void;
  level?: number;
}> = ({ attr, preferences, onPreferenceChange, level = 0 }) => {
  const currentPref = preferences[attr.key] || { uiPreference: 'Standard', customNote: '' };
  const hasSubAttributes = attr.subAttributes && attr.subAttributes.length > 0;

  return (
    <>
      <TableRow className={level > 0 ? 'bg-muted/30' : ''}>
        <TableCell style={{ paddingLeft: `${level * 1.5 + 1}rem` }} className="py-3 align-top">
          <div className="font-medium text-foreground">{attr.label}</div>
          <div className="text-xs text-muted-foreground">{attr.key}</div>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground py-3 align-top">{attr.type}{attr.arrayItemType ? ` of ${attr.arrayItemType}` : ''}</TableCell>
        <TableCell className="text-xs text-muted-foreground py-3 align-top max-w-xs break-words">{attr.description}</TableCell>
        <TableCell className="py-3 align-top w-40">
          <Select
            value={currentPref.uiPreference}
            onValueChange={(value) => onPreferenceChange(attr.key, 'uiPreference', value)}
          >
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{UI_DISPLAY_PREFERENCES.map(opt => (<SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>))}</SelectContent>
          </Select>
        </TableCell>
        <TableCell className="py-3 align-top w-52">
          <Input
            value={currentPref.customNote || ''}
            onChange={(e) => onPreferenceChange(attr.key, 'customNote', e.target.value)}
            className="h-9 text-xs"
            placeholder="E.g., Used for X..."
          />
        </TableCell>
      </TableRow>
      {hasSubAttributes && attr.subAttributes!.map(subAttr => (
        <AttributeRow
          key={subAttr.key}
          attr={subAttr}
          preferences={preferences}
          onPreferenceChange={onPreferenceChange}
          level={level + 1}
        />
      ))}
    </>
  );
};


export default function DataModelsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const [isClient, setIsClient] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [candidatePrefs, setCandidatePrefs] = useState<Record<string, Partial<Pick<UserDataModelPreference, 'uiPreference' | 'customNote'>>>>({});
  const [positionPrefs, setPositionPrefs] = useState<Record<string, Partial<Pick<UserDataModelPreference, 'uiPreference' | 'customNote'>>>>({});

  const loadPreferencesFromServer = useCallback(async () => {
    if (!session?.user?.id) return;
    setIsLoadingData(true);
    setFetchError(null);
    try {
      const response = await fetch(`/api/settings/user-preferences`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to load preferences' }));
        throw new Error(errorData.message);
      }
      const serverPrefs: UserDataModelPreference[] = await response.json();
      
      const newCandidatePrefs: typeof candidatePrefs = {};
      const newPositionPrefs: typeof positionPrefs = {};

      serverPrefs.forEach(pref => {
        if (pref.modelType === 'Candidate') {
          newCandidatePrefs[pref.attributeKey] = { uiPreference: pref.uiPreference, customNote: pref.customNote || '' };
        } else if (pref.modelType === 'Position') {
          newPositionPrefs[pref.attributeKey] = { uiPreference: pref.uiPreference, customNote: pref.customNote || '' };
        }
      });
      setCandidatePrefs(newCandidatePrefs);
      setPositionPrefs(newPositionPrefs);

    } catch (error) {
      console.error("Error loading preferences from server:", error);
      setFetchError((error as Error).message);
      if (Object.keys(candidatePrefs).length === 0 && Object.keys(positionPrefs).length === 0) {
        setCandidatePrefs({});
        setPositionPrefs({});
      }
    } finally {
      setIsLoadingData(false);
    }
  }, [session?.user?.id, candidatePrefs, positionPrefs]); 

  useEffect(() => {
    setIsClient(true);
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
      if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('USER_PREFERENCES_MANAGE')) {
        setFetchError("You do not have permission to manage data model preferences.");
        setIsLoadingData(false); 
      } else {
        loadPreferencesFromServer();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus, session, pathname, signIn, loadPreferencesFromServer]); 


  const handlePreferenceChange = (
    model: 'Candidate' | 'Position',
    attrKey: string,
    prefType: 'uiPreference' | 'customNote',
    value: string
  ) => {
    const setter = model === 'Candidate' ? setCandidatePrefs : setPositionPrefs;
    setter(prev => ({
      ...prev,
      [attrKey]: {
        ...prev[attrKey],
        [prefType]: value,
      },
    }));
  };

  const handleSavePreferences = async () => {
    if (!isClient || !session?.user?.id) return;
    setIsSaving(true);
    const prefsToSave: Omit<UserDataModelPreference, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    Object.entries(candidatePrefs).forEach(([key, pref]) => {
      prefsToSave.push({
        userId: session.user.id,
        modelType: 'Candidate',
        attributeKey: key,
        uiPreference: pref.uiPreference || 'Standard',
        customNote: pref.customNote || null,
      });
    });
    Object.entries(positionPrefs).forEach(([key, pref]) => {
      prefsToSave.push({
        userId: session.user.id,
        modelType: 'Position',
        attributeKey: key,
        uiPreference: pref.uiPreference || 'Standard',
        customNote: pref.customNote || null,
      });
    });

    try {
      const response = await fetch(`/api/settings/user-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefsToSave),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save preferences to server' }));
        throw new Error(errorData.message);
      }
      toast({ title: 'Preferences Saved', description: 'Your data model display preferences have been saved.' });
      loadPreferencesFromServer(); 
    } catch (error) {
      console.error("Error saving preferences to server:", error);
      toast({title: "Error Saving", description: (error as Error).message, variant: "destructive"});
    } finally {
      setIsSaving(false);
    }
  };
  
  if (sessionStatus === 'loading' || (isLoadingData && !fetchError && !isClient && Object.keys(candidatePrefs).length === 0 && Object.keys(positionPrefs).length === 0)) {
    return ( <div className="flex h-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div> );
  }

  if (fetchError && !isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied or Error</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient mr-2">Go to Dashboard</Button>
         {fetchError !== "You do not have permission to manage data model preferences." && 
            <Button onClick={loadPreferencesFromServer} variant="outline"><RefreshCw className="mr-2 h-4 w-4"/>Try Again</Button>
        }
      </div>
    );
  }

  const renderTable = (modelType: 'Candidate' | 'Position', attributes: ModelAttributeDefinition[], prefs: Record<string, Partial<Pick<UserDataModelPreference, 'uiPreference' | 'customNote'>>>) => (
     <Card>
        <CardHeader>
          <CardTitle>{modelType} Model Attributes</CardTitle>
          <CardDescription>Set preferences for {modelType.toLowerCase()} data fields.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
           <div className="border rounded-lg overflow-hidden">
            <ScrollArea className="max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%]">Attribute Label / Key</TableHead>
                    <TableHead className="w-[15%]">Type</TableHead>
                    <TableHead className="w-[30%]">Description</TableHead>
                    <TableHead className="w-[15%]">UI Display</TableHead>
                    <TableHead className="w-[15%]">Custom Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attributes.map(attr => (
                    <AttributeRow
                      key={attr.key}
                      attr={attr}
                      preferences={prefs}
                      onPreferenceChange={(key, type, val) => handlePreferenceChange(modelType, key, type, val)}
                    />
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
  );


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl"><DatabaseZap className="mr-3 h-6 w-6 text-primary"/>Data Model Preferences</CardTitle>
        <CardDescription>
          View attributes of your core data models (Candidate, Position) and set your UI display preferences or custom notes. These settings are saved server-side for your user account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="candidate-model" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="candidate-model">Candidate Model</TabsTrigger>
            <TabsTrigger value="position-model">Position Model</TabsTrigger>
          </TabsList>
          <TabsContent value="candidate-model" className="mt-4">
            {renderTable('Candidate', CANDIDATE_ATTRIBUTES, candidatePrefs)}
          </TabsContent>
          <TabsContent value="position-model" className="mt-4">
            {renderTable('Position', POSITION_ATTRIBUTES, positionPrefs)}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t pt-6 flex justify-end">
        <Button onClick={handleSavePreferences} size="lg" className="btn-primary-gradient" disabled={isSaving || isLoadingData}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save My Preferences'}
        </Button>
      </CardFooter>
    </Card>
  );
}

