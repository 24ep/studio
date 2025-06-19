
"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Search, FilterX, Check, ChevronsUpDown, Loader2, CalendarIcon, Brain, Users, Briefcase, Tag, Star, Building, ListFilter } from 'lucide-react';
import type { Position, CandidateStatus, RecruitmentStage, UserProfile } from '@/lib/types';
import { cn } from "@/lib/utils";
import { ScrollArea } from '../ui/scroll-area';
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from '@/components/ui/textarea';


export interface CandidateFilterValues {
  name?: string;
  email?: string;
  phone?: string;
  positionId?: string;
  status?: CandidateStatus | 'all';
  education?: string; // Education Keywords
  minFitScore?: number;
  maxFitScore?: number;
  applicationDateStart?: Date;
  applicationDateEnd?: Date;
  recruiterId?: string;
  aiSearchQuery?: string;
}

interface CandidateFiltersProps {
  initialFilters?: CandidateFilterValues;
  onFilterChange: (filters: CandidateFilterValues) => void;
  onAiSearch: (aiQuery: string) => void;
  availablePositions: Position[];
  availableStages: RecruitmentStage[];
  availableRecruiters: Pick<UserProfile, 'id' | 'name'>[];
  isLoading?: boolean;
  isAiSearching?: boolean;
}

const ALL_POSITIONS_SELECT_VALUE = "__ALL_POSITIONS__";
const ALL_STATUSES_SELECT_VALUE = "all";
const ALL_RECRUITERS_SELECT_VALUE = "__ALL_RECRUITERS__";

export function CandidateFilters({
    initialFilters = {},
    onFilterChange,
    onAiSearch,
    availablePositions,
    availableStages,
    availableRecruiters,
    isLoading,
    isAiSearching
}: CandidateFiltersProps) {
  const [name, setName] = useState(initialFilters.name || '');
  const [email, setEmail] = useState(initialFilters.email || '');
  const [phone, setPhone] = useState(initialFilters.phone || '');
  const [positionId, setPositionId] = useState(initialFilters.positionId || ALL_POSITIONS_SELECT_VALUE);
  const [status, setStatus] = useState<CandidateStatus | 'all'>(initialFilters.status || ALL_STATUSES_SELECT_VALUE);
  const [education, setEducation] = useState(initialFilters.education || '');
  const [fitScoreRange, setFitScoreRange] = useState<[number, number]>([
    initialFilters.minFitScore || 0,
    initialFilters.maxFitScore || 100,
  ]);
  const [applicationDateStart, setApplicationDateStart] = useState<Date | undefined>(initialFilters.applicationDateStart);
  const [applicationDateEnd, setApplicationDateEnd] = useState<Date | undefined>(initialFilters.applicationDateEnd);
  const [recruiterId, setRecruiterId] = useState(initialFilters.recruiterId || ALL_RECRUITERS_SELECT_VALUE);
  const [aiSearchQueryInput, setAiSearchQueryInput] = useState(initialFilters.aiSearchQuery || '');

  const [positionSearchOpen, setPositionSearchOpen] = useState(false);
  const [positionSearchQuery, setPositionSearchQuery] = useState('');
  const [statusSearchOpen, setStatusSearchOpen] = useState(false);
  const [statusSearchQuery, setStatusSearchQuery] = useState('');
  const [recruiterSearchOpen, setRecruiterSearchOpen] = useState(false);
  const [recruiterSearchQuery, setRecruiterSearchQuery] = useState('');

  const getCurrentPositionDisplayValue = () => {
    if (positionId === ALL_POSITIONS_SELECT_VALUE) return "All Positions";
    return availablePositions.find(p => p.id === positionId)?.title || "All Positions";
  };

  const getCurrentStatusDisplayValue = () => {
    if (status === ALL_STATUSES_SELECT_VALUE) return "All Statuses";
    return availableStages.find(s => s.name === status)?.name || "All Statuses";
  };

  const getCurrentRecruiterDisplayValue = () => {
    if (recruiterId === ALL_RECRUITERS_SELECT_VALUE) return "All Recruiters";
    return availableRecruiters.find(r => r.id === recruiterId)?.name || "All Recruiters";
  }

  useEffect(() => {
    setName(initialFilters.name || '');
    setEmail(initialFilters.email || '');
    setPhone(initialFilters.phone || '');
    setPositionId(initialFilters.positionId || ALL_POSITIONS_SELECT_VALUE);
    setStatus(initialFilters.status || ALL_STATUSES_SELECT_VALUE);
    setEducation(initialFilters.education || '');
    setFitScoreRange([initialFilters.minFitScore || 0, initialFilters.maxFitScore || 100]);
    setApplicationDateStart(initialFilters.applicationDateStart ? parseISO(String(initialFilters.applicationDateStart)) : undefined);
    setApplicationDateEnd(initialFilters.applicationDateEnd ? parseISO(String(initialFilters.applicationDateEnd)) : undefined);
    setRecruiterId(initialFilters.recruiterId || ALL_RECRUITERS_SELECT_VALUE);
    setAiSearchQueryInput(initialFilters.aiSearchQuery || '');
  }, [initialFilters]);


  const handleApplyStandardFilters = () => {
    onFilterChange({
      name: name || undefined,
      email: email || undefined,
      phone: phone || undefined,
      positionId: positionId === ALL_POSITIONS_SELECT_VALUE ? undefined : positionId,
      status: status === ALL_STATUSES_SELECT_VALUE ? undefined : status,
      education: education || undefined,
      minFitScore: fitScoreRange[0],
      maxFitScore: fitScoreRange[1],
      applicationDateStart: applicationDateStart,
      applicationDateEnd: applicationDateEnd,
      recruiterId: recruiterId === ALL_RECRUITERS_SELECT_VALUE ? undefined : recruiterId,
      aiSearchQuery: undefined,
    });
  };

  const handleAiSearchClick = () => {
    if (aiSearchQueryInput.trim()) {
      onAiSearch(aiSearchQueryInput.trim());
    }
  };

  const handleResetFilters = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPositionId(ALL_POSITIONS_SELECT_VALUE);
    setStatus(ALL_STATUSES_SELECT_VALUE);
    setEducation('');
    setFitScoreRange([0, 100]);
    setApplicationDateStart(undefined);
    setApplicationDateEnd(undefined);
    setRecruiterId(ALL_RECRUITERS_SELECT_VALUE);
    setAiSearchQueryInput('');
    setPositionSearchQuery('');
    setStatusSearchQuery('');
    setRecruiterSearchQuery('');
    onFilterChange({
      minFitScore: 0,
      maxFitScore: 100,
      positionId: undefined,
      status: undefined,
      recruiterId: undefined,
      aiSearchQuery: undefined,
    });
  };

  const filteredPositions = positionSearchQuery
    ? availablePositions.filter(pos => pos.title.toLowerCase().includes(positionSearchQuery.toLowerCase()))
    : availablePositions;

  const filteredStages = statusSearchQuery
    ? availableStages.filter(stage => stage.name.toLowerCase().includes(statusSearchQuery.toLowerCase()))
    : availableStages;

  const filteredRecruiters = recruiterSearchQuery
    ? availableRecruiters.filter(r => r.name.toLowerCase().includes(recruiterSearchQuery.toLowerCase()))
    : availableRecruiters;

  const filterGroups = [
    {
      title: "Basic Info",
      icon: Users,
      defaultOpen: true,
      fields: (
        <>
          <div><Label htmlFor="name-search" className="text-xs">Name</Label><Input id="name-search" placeholder="Filter by name..." value={name} onChange={(e) => setName(e.target.value)} className="mt-1" disabled={isLoading || isAiSearching}/></div>
          <div><Label htmlFor="email-search" className="text-xs">Email</Label><Input id="email-search" placeholder="Filter by email..." value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" disabled={isLoading || isAiSearching}/></div>
          <div><Label htmlFor="phone-search" className="text-xs">Phone</Label><Input id="phone-search" placeholder="Filter by phone..." value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" disabled={isLoading || isAiSearching}/></div>
        </>
      )
    },
    {
      title: "Job Details",
      icon: Briefcase,
      defaultOpen: true,
      fields: (
        <>
          <div>
            <Label htmlFor="position-combobox" className="text-xs">Position</Label>
            <Popover open={positionSearchOpen} onOpenChange={setPositionSearchOpen}>
              <PopoverTrigger asChild><Button variant="outline" role="combobox" aria-expanded={positionSearchOpen} className="w-full justify-between mt-1 text-xs" disabled={isLoading || isAiSearching}><span className="truncate">{getCurrentPositionDisplayValue()}</span><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger>
              <PopoverContent className="w-[--trigger-width] p-0 dropdown-content-height"><div className="p-2"><Input placeholder="Search position..." value={positionSearchQuery} onChange={(e) => setPositionSearchQuery(e.target.value)} className="h-9 text-xs"/></div>
                <ScrollArea className="max-h-60"><Button variant="ghost" className={cn("w-full justify-start px-2 py-1.5 text-xs font-normal h-auto", positionId === ALL_POSITIONS_SELECT_VALUE && "bg-accent text-accent-foreground")} onClick={() => {setPositionId(ALL_POSITIONS_SELECT_VALUE); setPositionSearchOpen(false); setPositionSearchQuery('');}}><Check className={cn("mr-2 h-4 w-4", positionId === ALL_POSITIONS_SELECT_VALUE ? "opacity-100" : "opacity-0")}/>All Positions</Button>
                  {filteredPositions.length === 0 && positionSearchQuery && (<p className="p-2 text-xs text-muted-foreground text-center">No position found.</p>)}
                  {filteredPositions.map((pos) => (<Button key={pos.id} variant="ghost" className={cn("w-full justify-start px-2 py-1.5 text-xs font-normal h-auto", positionId === pos.id && "bg-accent text-accent-foreground")} onClick={() => {setPositionId(pos.id); setPositionSearchOpen(false); setPositionSearchQuery('');}}><Check className={cn("mr-2 h-4 w-4", positionId === pos.id ? "opacity-100" : "opacity-0")}/>{pos.title}</Button>))}
                </ScrollArea></PopoverContent></Popover></div>
          <div>
            <Label htmlFor="status-combobox" className="text-xs">Status</Label>
            <Popover open={statusSearchOpen} onOpenChange={setStatusSearchOpen}>
              <PopoverTrigger asChild><Button variant="outline" role="combobox" aria-expanded={statusSearchOpen} className="w-full justify-between mt-1 text-xs" disabled={isLoading || isAiSearching}><span className="truncate">{getCurrentStatusDisplayValue()}</span><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger>
              <PopoverContent className="w-[--trigger-width] p-0 dropdown-content-height"><div className="p-2"><Input placeholder="Search status..." value={statusSearchQuery} onChange={(e) => setStatusSearchQuery(e.target.value)} className="h-9 text-xs"/></div>
                <ScrollArea className="max-h-60"><Button variant="ghost" className={cn("w-full justify-start px-2 py-1.5 text-xs font-normal h-auto", status === ALL_STATUSES_SELECT_VALUE && "bg-accent text-accent-foreground")} onClick={() => {setStatus(ALL_STATUSES_SELECT_VALUE); setStatusSearchOpen(false); setStatusSearchQuery('');}}><Check className={cn("mr-2 h-4 w-4", status === ALL_STATUSES_SELECT_VALUE ? "opacity-100" : "opacity-0")}/>All Statuses</Button>
                  {filteredStages.length === 0 && statusSearchQuery && (<p className="p-2 text-xs text-muted-foreground text-center">No status found.</p>)}
                  {filteredStages.map((st) => (<Button key={st.id} variant="ghost" className={cn("w-full justify-start px-2 py-1.5 text-xs font-normal h-auto", status === st.name && "bg-accent text-accent-foreground")} onClick={() => {setStatus(st.name); setStatusSearchOpen(false); setStatusSearchQuery('');}}><Check className={cn("mr-2 h-4 w-4", status === st.name ? "opacity-100" : "opacity-0")}/>{st.name}</Button>))}
                </ScrollArea></PopoverContent></Popover></div>
          <div>
            <Label htmlFor="recruiter-combobox" className="text-xs">Assigned Recruiter</Label>
            <Popover open={recruiterSearchOpen} onOpenChange={setRecruiterSearchOpen}>
              <PopoverTrigger asChild><Button variant="outline" role="combobox" aria-expanded={recruiterSearchOpen} className="w-full justify-between mt-1 text-xs" disabled={isLoading || isAiSearching}><span className="truncate">{getCurrentRecruiterDisplayValue()}</span><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger>
              <PopoverContent className="w-[--trigger-width] p-0 dropdown-content-height"><div className="p-2"><Input placeholder="Search recruiter..." value={recruiterSearchQuery} onChange={(e) => setRecruiterSearchQuery(e.target.value)} className="h-9 text-xs"/></div>
                <ScrollArea className="max-h-60"><Button variant="ghost" className={cn("w-full justify-start px-2 py-1.5 text-xs font-normal h-auto", recruiterId === ALL_RECRUITERS_SELECT_VALUE && "bg-accent text-accent-foreground")} onClick={() => {setRecruiterId(ALL_RECRUITERS_SELECT_VALUE); setRecruiterSearchOpen(false); setRecruiterSearchQuery('');}}><Check className={cn("mr-2 h-4 w-4", recruiterId === ALL_RECRUITERS_SELECT_VALUE ? "opacity-100" : "opacity-0")}/>All Recruiters</Button>
                  {filteredRecruiters.length === 0 && recruiterSearchQuery && (<p className="p-2 text-xs text-muted-foreground text-center">No recruiter found.</p>)}
                  {filteredRecruiters.map((rec) => (<Button key={rec.id} variant="ghost" className={cn("w-full justify-start px-2 py-1.5 text-xs font-normal h-auto", recruiterId === rec.id && "bg-accent text-accent-foreground")} onClick={() => {setRecruiterId(rec.id); setRecruiterSearchOpen(false); setRecruiterSearchQuery('');}}><Check className={cn("mr-2 h-4 w-4", recruiterId === rec.id ? "opacity-100" : "opacity-0")}/>{rec.name}</Button>))}
                </ScrollArea></PopoverContent></Popover></div>
        </>
      )
    },
    {
      title: "Profile Attributes",
      icon: Tag,
      defaultOpen: false,
      fields: (
        <>
          <div><Label htmlFor="education-search" className="text-xs">Education Keywords</Label><Input id="education-search" placeholder="e.g., BSc, CompSci..." value={education} onChange={(e) => setEducation(e.target.value)} className="mt-1" disabled={isLoading || isAiSearching}/></div>
          <div>
              <Label className="text-xs">Fit Score ({fitScoreRange[0]}% - {fitScoreRange[1]}%)</Label>
              <Popover>
                  <PopoverTrigger asChild><Button variant="outline" className="w-full mt-1 justify-start text-left font-normal text-xs" disabled={isLoading || isAiSearching}><span>{fitScoreRange[0]} - {fitScoreRange[1]}%</span><ListFilter className="ml-auto h-4 w-4 opacity-50" /></Button></PopoverTrigger>
                  <PopoverContent className="w-64 p-4" align="start"><Slider min={0} max={100} step={1} value={[fitScoreRange[0], fitScoreRange[1]]} onValueChange={(newRange) => setFitScoreRange(newRange as [number, number])} className="my-4" disabled={isLoading || isAiSearching}/>
                  <div className="flex justify-between text-xs text-muted-foreground"><span>{fitScoreRange[0]}%</span><span>{fitScoreRange[1]}%</span></div></PopoverContent>
              </Popover>
          </div>
        </>
      )
    },
    {
      title: "Application Dates",
      icon: CalendarIcon,
      defaultOpen: false,
      fields: (
         <div className="flex flex-col gap-2">
            <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal text-xs", !applicationDateStart && "text-muted-foreground")} disabled={isLoading || isAiSearching}><CalendarIcon className="mr-2 h-4 w-4" />{applicationDateStart ? format(applicationDateStart, "PPP") : <span>Start Date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={applicationDateStart} onSelect={setApplicationDateStart} initialFocus /></PopoverContent></Popover>
            <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal text-xs", !applicationDateEnd && "text-muted-foreground")} disabled={isLoading || isAiSearching}><CalendarIcon className="mr-2 h-4 w-4" />{applicationDateEnd ? format(applicationDateEnd, "PPP") : <span>End Date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={applicationDateEnd} onSelect={setApplicationDateEnd} initialFocus /></PopoverContent></Popover>
         </div>
      )
    }
  ];

  return (
    <div className="p-4 space-y-4"> {/* Removed Card wrapper, added padding directly */}
        <div>
            <Label htmlFor="ai-search-query" className="text-sm font-medium">AI Powered Search</Label>
            <Textarea
                id="ai-search-query"
                placeholder="e.g., 'Java developer with React skills and 5 years experience in fintech...'"
                value={aiSearchQueryInput}
                onChange={(e) => setAiSearchQueryInput(e.target.value)}
                disabled={isLoading || isAiSearching}
                className="mt-1 min-h-[80px]" // Adjusted min-height
                rows={4} // Suggest more rows for textarea
            />
            <Button onClick={handleAiSearchClick} disabled={isLoading || isAiSearching || !aiSearchQueryInput.trim()} className="mt-2 w-full sm:w-auto btn-primary-gradient">
                {isAiSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                AI Search
            </Button>
        </div>

        <div className="flex items-center my-3">
          <span className="flex-grow border-t"></span>
          <span className="mx-2 text-xs text-muted-foreground uppercase">Or</span>
          <span className="flex-grow border-t"></span>
        </div>

        <Label className="text-sm font-medium text-muted-foreground mb-2 block">Standard Filters</Label>
        <Accordion type="multiple" defaultValue={filterGroups.filter(g => g.defaultOpen).map(g => g.title)} className="w-full">
          {filterGroups.map(group => (
            <AccordionItem value={group.title} key={group.title}>
              <AccordionTrigger className="py-2 text-sm hover:no-underline">
                <div className="flex items-center">
                  <group.icon className="mr-2 h-4 w-4 text-primary/80" />
                  {group.title}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 p-1">{group.fields}</div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleResetFilters} disabled={isLoading || isAiSearching} className="w-full sm:w-auto">
                <FilterX className="mr-2 h-4 w-4" /> Reset All Filters
            </Button>
            <Button onClick={handleApplyStandardFilters} disabled={isLoading || isAiSearching} className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Apply Standard Filters
            </Button>
        </div>
    </div>
  );
}
