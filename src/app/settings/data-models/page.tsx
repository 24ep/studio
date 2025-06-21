
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
import { Save, DatabaseZap, Info, ServerCrash, ShieldAlert, Loader2, RefreshCw, Type, List, Braces, ToggleRight, Calendar, Hash } from 'lucide-react';
import type { UserDataModelPreference, UIDisplayPreference, ModelAttributeDefinition } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const UI_DISPLAY_PREFERENCES: UIDisplayPreference[] = ["Standard", "Emphasized", "Hidden"];

const CANDIDATE_ATTRIBUTES: ModelAttributeDefinition[] = [
  { key: 'id', label: 'ID', type: 'string (UUID)', description: 'Unique identifier for the candidate.', icon: Hash },
  { key: 'name', label: 'Full Name', type: 'string', description: 'Full name of the candidate.', icon: Type },
  { key: 'email', label: 'Email', type: 'string', description: 'Primary email address.', icon: Type },
  { key: 'phone', label: 'Phone', type: 'string', description: 'Contact phone number.', icon: Type },
  { key: 'avatarUrl', label: 'Avatar URL', type: 'string', description: 'URL to the candidate\'s profile picture.', icon: Type },
  { key: 'resumePath', label: 'Resume File Path', type: 'string', description: 'Path to the stored resume file in MinIO.', icon: Type },
  { key: 'positionId', label: 'Applied Position ID', type: 'string (UUID)', description: 'ID of the position the candidate applied for.', icon: Hash },
  { key: 'fitScore', label: 'Fit Score', type: 'number', description: 'Calculated score indicating suitability for the applied position (0-100).', icon: Hash },
  { key: 'status', label: 'Current Status', type: 'string', description: 'Current stage in the recruitment pipeline (e.g., Applied, Screening).', icon: Type },
  { key: 'applicationDate', label: 'Application Date', type: 'date', description: 'Date the candidate applied.', icon: Calendar },
  { key: 'recruiterId', label: 'Assigned Recruiter ID', type: 'string (UUID)', description: 'ID of the recruiter assigned to this candidate.', icon: Hash },
  { key: 'parsedData', label: 'Parsed Resume Data', type: 'object', description: 'Structured data extracted from the resume.', icon: Braces, subAttributes: [
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
    { key: 'parsedData.associatedMatchDetails', label: 'Primary Matched Job Details', type: 'object', description: 'Details of the job the candidate was primarily matched/applied to by automated processing.',
      subAttributes: [ { key: 'parsedData.associatedMatchDetails.jobTitle', label: 'Matched Job Title', type: 'string', description: 'Title of the matched job.'}, { key: 'parsedData.associatedMatchDetails.fitScore', label: 'Matched Fit Score', type: 'number', description: 'Fit score for this specific match.'}, { key: 'parsedData.associatedMatchDetails.reasons', label: 'Match Reasons', type: 'array of strings', description: 'Reasons for this match.'}, { key: 'parsedData.associatedMatchDetails.n8nJobId', label: 'Matched Job n8n ID', type: 'string', description: 'ID of the job from the n8n matching process, if available.'}, ]
    },
    { key: 'parsedData.job_matches', label: 'All Suggested Job Matches', type: 'array', arrayItemType: 'N8NJobMatch object', description: 'Full list of job suggestions from automated processing.'},
  ]},
  { key: 'transitionHistory', label: 'Transition History', type: 'array', arrayItemType: 'TransitionRecord object', description: 'Log of status changes.', icon: List },
  { key: 'custom_attributes', label: 'Custom Attributes', type: 'object', description: 'User-defined custom fields and their values.', icon: Braces },
  { key: 'createdAt', label: 'Created At', type: 'date', description: 'Timestamp of creation.', icon: Calendar },
  { key: 'updatedAt', label: 'Last Updated At', type: 'date', description: 'Timestamp of last update.', icon: Calendar },
];

const POSITION_ATTRIBUTES: ModelAttributeDefinition[] = [
  { key: 'id', label: 'ID', type: 'string (UUID)', description: 'Unique identifier for the position.', icon: Hash },
  { key: 'title', label: 'Title', type: 'string', description: 'Job title.', icon: Type },
  { key: 'department', label: 'Department', type: 'string', description: 'Department the position belongs to.', icon: Type },
  { key: 'description', label: 'Description', type: 'string (multiline)', description: 'Detailed job description.', icon: Type },
  { key: 'isOpen', label: 'Is Open', type: 'boolean', description: 'Whether the position is currently open for applications.', icon: ToggleRight },
  { key: 'position_level', label: 'Position Level', type: 'string', description: 'Seniority level (e.g., Senior, Mid-Level).', icon: Type },
  { key: 'custom_attributes', label: 'Custom Attributes', type: 'object', description: 'User-defined custom fields and their values.', icon: Braces },
  { key: 'createdAt', label: 'Created At', type: 'date', description: 'Timestamp of creation.', icon: Calendar },
  { key: 'updatedAt', label: 'Last Updated At', type: 'date', description: 'Timestamp of last update.', icon: Calendar },
];


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
  
  const [activeCandidateSection, setActiveCandidateSection] = useState<string>(CANDIDATE_ATTRIBUTES[0].key);
  const [activePositionSection, setActivePositionSection] = useState<string>(POSITION_ATTRIBUTES[0].key);


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
    } finally {
      setIsLoadingData(false);
    }
  }, [session?.user?.id]); 

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
        uiPreference: prefType === 'uiPreference' ? (value as UIDisplayPreference) : (prev[attrKey]?.uiPreference || 'Standard'),
        [prefType]: value,
      },
    }));
  };

  const handleSavePreferences = async () => {
    if (!isClient || !session?.user?.id) return;
    setIsSaving(true);
    
    // Combine all known attributes with their current preference state
    const allKnownAttributes = [...CANDIDATE_ATTRIBUTES, ...POSITION_ATTRIBUTES];
    const prefsToSave: Omit<UserDataModelPreference, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    
    const processAttributes = (attributes: ModelAttributeDefinition[], modelType: 'Candidate' | 'Position', prefs: typeof candidatePrefs) => {
        attributes.forEach(attr => {
            prefsToSave.push({
                userId: session.user!.id,
                modelType: modelType,
                attributeKey: attr.key,
                uiPreference: prefs[attr.key]?.uiPreference || 'Standard',
                customNote: prefs[attr.key]?.customNote || null,
            });
            if (attr.subAttributes) {
                processAttributes(attr.subAttributes, modelType, prefs);
            }
        });
    };

    processAttributes(CANDIDATE_ATTRIBUTES, 'Candidate', candidatePrefs);
    processAttributes(POSITION_ATTRIBUTES, 'Position', positionPrefs);

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

  const renderPreferenceControls = (
    modelType: 'Candidate' | 'Position',
    attr: ModelAttributeDefinition
  ) => {
    const prefs = modelType === 'Candidate' ? candidatePrefs : positionPrefs;
    const currentPref = prefs[attr.key] || { uiPreference: 'Standard', customNote: '' };
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <Label htmlFor={`ui-pref-${attr.key}`} className="text-xs">UI Display</Label>
          <Select
            value={currentPref.uiPreference}
            onValueChange={(value) => handlePreferenceChange(modelType, attr.key, 'uiPreference', value)}
          >
            <SelectTrigger id={`ui-pref-${attr.key}`} className="h-9 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{UI_DISPLAY_PREFERENCES.map(opt => (<SelectItem key={opt} value={opt} className="text-sm">{opt}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div>
           <Label htmlFor={`note-${attr.key}`} className="text-xs">Custom Note</Label>
           <Input
            id={`note-${attr.key}`}
            value={currentPref.customNote || ''}
            onChange={(e) => handlePreferenceChange(modelType, attr.key, 'customNote', e.target.value)}
            className="h-9 mt-1"
            placeholder="E.g., Used for X..."
          />
        </div>
      </div>
    );
  }
  
  const renderAttributeSection = (
    modelType: 'Candidate' | 'Position',
    attributes: ModelAttributeDefinition[],
    activeSection: string
  ) => {
    const selectedAttrGroup = attributes.find(attr => attr.key === activeSection);
    if (!selectedAttrGroup) return <div className="p-6">Select an attribute from the list.</div>;
    
    const attributesToRender = selectedAttrGroup.subAttributes || [selectedAttrGroup];

    return (
        <div className="flex-1">
            <ScrollArea className="h-full md:max-h-[calc(100vh-21rem)] p-6">
                <CardHeader className="p-0 mb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">{selectedAttrGroup.icon && <selectedAttrGroup.icon className="h-5 w-5"/>}{selectedAttrGroup.label}</CardTitle>
                    <CardDescription>{selectedAttrGroup.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                    {attributesToRender.map(attr => (
                        <div key={attr.key} className="p-4 border rounded-lg bg-muted/30">
                            <h4 className="font-semibold text-foreground">{attr.label}</h4>
                            <div className="text-xs space-x-2 text-muted-foreground mt-0.5">
                                <code className="text-xs bg-muted/80 px-1 py-0.5 rounded">{attr.key}</code>
                                <span>-</span>
                                <span>Type: {attr.type}{attr.arrayItemType ? ` of ${attr.arrayItemType}` : ''}</span>
                            </div>
                            {attr.description && <p className="text-sm text-muted-foreground mt-1">{attr.description}</p>}
                            {renderPreferenceControls(modelType, attr)}
                        </div>
                    ))}
                </CardContent>
            </ScrollArea>
        </div>
    );
  };
  
  if (sessionStatus === 'loading' || (isLoadingData && !fetchError && !isClient)) {
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

  return (
    <Card className="shadow-lg overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl"><DatabaseZap className="mr-3 h-6 w-6 text-primary"/>Data Model Preferences</CardTitle>
        <CardDescription>
          View attributes of your core data models and set your UI display preferences or custom notes. These settings are saved server-side for your user account.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="candidate-model" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="candidate-model">Candidate Model</TabsTrigger>
            <TabsTrigger value="position-model">Position Model</TabsTrigger>
          </TabsList>
          
          <TabsContent value="candidate-model" className="mt-0 border-t">
              <div className="flex flex-col md:flex-row min-h-[calc(100vh-21rem)]">
                 <aside className="md:w-72 lg:w-80 border-b md:border-b-0 md:border-r bg-muted/30">
                    <ScrollArea className="h-full md:max-h-[calc(100vh-21rem)] p-2">
                        <nav className="space-y-1">
                            {CANDIDATE_ATTRIBUTES.map(attr => (
                                <Button key={attr.key} variant={activeCandidateSection === attr.key ? 'default' : 'ghost'} onClick={() => setActiveCandidateSection(attr.key)} className={cn("w-full justify-start text-sm", activeCandidateSection === attr.key && "btn-primary-gradient")}>
                                    {attr.icon && <attr.icon className="h-4 w-4 mr-2"/>} {attr.label}
                                </Button>
                            ))}
                        </nav>
                    </ScrollArea>
                 </aside>
                {renderAttributeSection('Candidate', CANDIDATE_ATTRIBUTES, activeCandidateSection)}
              </div>
          </TabsContent>
          <TabsContent value="position-model" className="mt-0 border-t">
               <div className="flex flex-col md:flex-row min-h-[calc(100vh-21rem)]">
                 <aside className="md:w-72 lg:w-80 border-b md:border-b-0 md:border-r bg-muted/30">
                    <ScrollArea className="h-full md:max-h-[calc(100vh-21rem)] p-2">
                        <nav className="space-y-1">
                            {POSITION_ATTRIBUTES.map(attr => (
                                <Button key={attr.key} variant={activePositionSection === attr.key ? 'default' : 'ghost'} onClick={() => setActivePositionSection(attr.key)} className={cn("w-full justify-start text-sm", activePositionSection === attr.key && "btn-primary-gradient")}>
                                   {attr.icon && <attr.icon className="h-4 w-4 mr-2"/>} {attr.label}
                                </Button>
                            ))}
                        </nav>
                    </ScrollArea>
                 </aside>
                {renderAttributeSection('Position', POSITION_ATTRIBUTES, activePositionSection)}
              </div>
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

