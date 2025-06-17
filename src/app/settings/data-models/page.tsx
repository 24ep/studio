
// src/app/settings/data-models/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Save, DatabaseZap, HelpCircle, Eye, EyeOff, Star, ServerCrash, ShieldAlert, Loader2 } from 'lucide-react';
import type { DataModelPreferences, AttributePreference, UIDisplayPreference, ModelAttributeDefinition } from '@/lib/types';

const CANDIDATE_MODEL_PREFERENCES_KEY = 'candidateModelPreferences';
const POSITION_MODEL_PREFERENCES_KEY = 'positionModelPreferences';

const UI_DISPLAY_PREFERENCES: UIDisplayPreference[] = ["Standard", "Emphasized", "Hidden"];

// Define the structure of your models for display
const CANDIDATE_ATTRIBUTES: ModelAttributeDefinition[] = [
  { key: 'id', label: 'ID', type: 'string (UUID)', description: 'Unique identifier for the candidate.' },
  { key: 'name', label: 'Full Name', type: 'string', description: 'Full name of the candidate.' },
  { key: 'email', label: 'Email', type: 'string', description: 'Primary email address.' },
  { key: 'phone', label: 'Phone', type: 'string', description: 'Contact phone number.' },
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
      { key: 'parsedData.personal_info.avatar_url', label: 'Avatar URL', type: 'string (url)'},
    ]},
    { key: 'parsedData.contact_info', label: 'Contact Info (from CV)', type: 'object', subAttributes: [
      { key: 'parsedData.contact_info.email', label: 'Email (from CV)', type: 'string'},
      { key: 'parsedData.contact_info.phone', label: 'Phone (from CV)', type: 'string'},
    ]},
    { key: 'parsedData.education', label: 'Education History', type: 'array', arrayItemType: 'EducationEntry object', description: 'List of educational qualifications.' },
    { key: 'parsedData.experience', label: 'Work Experience', type: 'array', arrayItemType: 'ExperienceEntry object', description: 'List of previous jobs.' },
    { key: 'parsedData.skills', label: 'Skills', type: 'array', arrayItemType: 'SkillEntry object', description: 'List of skills.' },
    { key: 'parsedData.job_suitable', label: 'Job Suitability', type: 'array', arrayItemType: 'JobSuitableEntry object', description: 'Information on suitable job types.' },
    { key: 'parsedData.associatedMatchDetails', label: 'Primary Matched Job Details', type: 'object', description: 'Details of the job the candidate was primarily matched/applied to.'},
    { key: 'parsedData.job_matches', label: 'All Suggested Job Matches', type: 'array', arrayItemType: 'N8NJobMatch object', description: 'Full list of job suggestions from automated processing.'},
  ]},
  { key: 'transitionHistory', label: 'Transition History', type: 'array', arrayItemType: 'TransitionRecord object', description: 'Log of status changes.' },
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
  { key: 'createdAt', label: 'Created At', type: 'date', description: 'Timestamp of creation.' },
  { key: 'updatedAt', label: 'Last Updated At', type: 'date', description: 'Timestamp of last update.' },
];


const AttributeEditor: React.FC<{
  attr: ModelAttributeDefinition;
  preferences: Record<string, Partial<Pick<AttributePreference, 'uiPreference' | 'customNote'>>>;
  onPreferenceChange: (attrKey: string, prefType: 'uiPreference' | 'customNote', value: string) => void;
  level?: number;
}> = ({ attr, preferences, onPreferenceChange, level = 0 }) => {
  const currentPref = preferences[attr.key] || {};
  const hasSubAttributes = attr.subAttributes && attr.subAttributes.length > 0;

  return (
    <div className={`py-3 ${level > 0 ? `ml-${level * 4} pl-3 border-l border-dashed border-muted` : ''} ${hasSubAttributes ? 'mb-2' : 'border-b border-muted'}`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{attr.label}</h4>
          <p className="text-xs text-muted-foreground italic">Type: {attr.type}{attr.arrayItemType ? ` of ${attr.arrayItemType}` : ''}</p>
          {attr.description && <p className="text-xs text-muted-foreground mt-0.5">{attr.description}</p>}
          <p className="text-xs text-muted-foreground mt-0.5">Key: <code className="text-xs bg-muted/50 px-1 rounded">{attr.key}</code></p>
        </div>
        <div className="flex-shrink-0 w-full sm:w-auto space-y-2 sm:space-y-0 sm:flex sm:items-end sm:gap-2">
          <div className="flex-1 sm:min-w-[150px]">
            <Label htmlFor={`${attr.key}-uiPref`} className="text-xs">UI Display</Label>
            <Select
              value={currentPref.uiPreference || 'Standard'}
              onValueChange={(value) => onPreferenceChange(attr.key, 'uiPreference', value)}
            >
              <SelectTrigger id={`${attr.key}-uiPref`} className="h-9 text-xs mt-0.5">
                <SelectValue placeholder="Select display preference" />
              </SelectTrigger>
              <SelectContent>
                {UI_DISPLAY_PREFERENCES.map(opt => (
                  <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="flex-1 sm:min-w-[200px]">
            <Label htmlFor={`${attr.key}-customNote`} className="text-xs">Custom Note</Label>
            <Input
              id={`${attr.key}-customNote`}
              value={currentPref.customNote || ''}
              onChange={(e) => onPreferenceChange(attr.key, 'customNote', e.target.value)}
              className="h-9 text-xs mt-0.5"
              placeholder="E.g., Used for X, Sync with Y"
            />
          </div>
        </div>
      </div>
      {hasSubAttributes && (
        <div className="mt-2">
          {attr.subAttributes!.map(subAttr => (
            <AttributeEditor
              key={subAttr.key}
              attr={subAttr}
              preferences={preferences}
              onPreferenceChange={onPreferenceChange}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};


export default function DataModelsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // For initial localStorage load
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [candidatePrefs, setCandidatePrefs] = useState<DataModelPreferences['candidateAttributes']>({});
  const [positionPrefs, setPositionPrefs] = useState<DataModelPreferences['positionAttributes']>({});

  useEffect(() => {
    setIsClient(true);
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
      if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('DATA_MODELS_MANAGE')) {
        setFetchError("You do not have permission to manage data model preferences.");
        setIsLoading(false);
        return;
      }
      try {
        const storedCandidatePrefs = localStorage.getItem(CANDIDATE_MODEL_PREFERENCES_KEY);
        if (storedCandidatePrefs) setCandidatePrefs(JSON.parse(storedCandidatePrefs));

        const storedPositionPrefs = localStorage.getItem(POSITION_MODEL_PREFERENCES_KEY);
        if (storedPositionPrefs) setPositionPrefs(JSON.parse(storedPositionPrefs));
      } catch (error) {
        console.error("Error loading preferences from localStorage:", error);
        toast({title: "Error", description: "Could not load saved preferences.", variant: "destructive"});
      }
      setIsLoading(false);
    }
  }, [sessionStatus, session, pathname, signIn, toast]);

  const handlePreferenceChange = (
    model: 'candidate' | 'position',
    attrKey: string,
    prefType: 'uiPreference' | 'customNote',
    value: string
  ) => {
    const setter = model === 'candidate' ? setCandidatePrefs : setPositionPrefs;
    setter(prev => ({
      ...prev,
      [attrKey]: {
        ...prev[attrKey],
        [prefType]: value,
      },
    }));
  };

  const handleSavePreferences = () => {
    if (!isClient) return;
    try {
      localStorage.setItem(CANDIDATE_MODEL_PREFERENCES_KEY, JSON.stringify(candidatePrefs));
      localStorage.setItem(POSITION_MODEL_PREFERENCES_KEY, JSON.stringify(positionPrefs));
      toast({ title: 'Preferences Saved', description: 'Your data model display preferences have been saved locally.' });
    } catch (error) {
      console.error("Error saving preferences to localStorage:", error);
      toast({title: "Error Saving", description: "Could not save preferences.", variant: "destructive"});
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
          <CardTitle className="flex items-center"><DatabaseZap className="mr-2 h-6 w-6 text-primary"/>Data Model Preferences</CardTitle>
          <CardDescription>
            View attributes of your core data models (Candidate, Position) and set local UI display preferences or custom notes.
            These settings are stored in your browser and do not change the backend database schema or validation.
          </CardDescription>
        </CardHeader>
      </Card>

      <Accordion type="multiple" defaultValue={['candidate-model', 'position-model']} className="w-full space-y-4">
        <AccordionItem value="candidate-model">
          <Card>
            <AccordionTrigger className="p-6 hover:no-underline">
              <CardHeader className="p-0 text-left">
                <CardTitle>Candidate Model Attributes</CardTitle>
                <CardDescription>Set preferences for candidate data fields.</CardDescription>
              </CardHeader>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="pt-0">
                {CANDIDATE_ATTRIBUTES.map(attr => (
                  <AttributeEditor
                    key={attr.key}
                    attr={attr}
                    preferences={candidatePrefs}
                    onPreferenceChange={(key, type, val) => handlePreferenceChange('candidate', key, type, val)}
                  />
                ))}
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="position-model">
           <Card>
            <AccordionTrigger className="p-6 hover:no-underline">
              <CardHeader className="p-0 text-left">
                <CardTitle>Position Model Attributes</CardTitle>
                <CardDescription>Set preferences for job position data fields.</CardDescription>
              </CardHeader>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="pt-0">
                {POSITION_ATTRIBUTES.map(attr => (
                  <AttributeEditor
                    key={attr.key}
                    attr={attr}
                    preferences={positionPrefs}
                    onPreferenceChange={(key, type, val) => handlePreferenceChange('position', key, type, val)}
                  />
                ))}
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>
      
      <div className="flex justify-end mt-6">
        <Button onClick={handleSavePreferences} size="lg" className="btn-primary-gradient">
          <Save className="mr-2 h-4 w-4" /> Save All Preferences
        </Button>
      </div>
    </div>
  );
}
