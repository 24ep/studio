
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
import { format, parseISO, addDays } from 'date-fns';
import type { DateRange } from "react-day-picker";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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
  
  const [applicationDateRange, setApplicationDateRange] = useState<DateRange | undefined>(
    initialFilters.applicationDateStart && initialFilters.applicationDateEnd
      ? { from: initialFilters.applicationDateStart, to: initialFilters.applicationDateEnd }
      : undefined
  );

  const [recruiterId, setRecruiterId] = useState(initialFilters.recruiterId || ALL_RECRUITERS_SELECT_VALUE);
  const [aiSearchQueryInput, setAiSearchQueryInput] = useState(initialFilters.aiSearchQuery || '');

  const currentYear = new Date().getFullYear();
  const fromYear = currentYear - 10;
  const toYear = currentYear + 1;

  useEffect(() => {
    setName(initialFilters.name || '');
    setEmail(initialFilters.email || '');
    setPhone(initialFilters.phone || '');
    setPositionId(initialFilters.positionId || ALL_POSITIONS_SELECT_VALUE);
    setStatus(initialFilters.status || ALL_STATUSES_SELECT_VALUE);
    setEducation(initialFilters.education || '');
    setFitScoreRange([initialFilters.minFitScore || 0, initialFilters.maxFitScore || 100]);
    setApplicationDateRange(
      initialFilters.applicationDateStart && initialFilters.applicationDateEnd
        ? { from: parseISO(String(initialFilters.applicationDateStart)), to: parseISO(String(initialFilters.applicationDateEnd)) }
        : initialFilters.applicationDateStart
        ? { from: parseISO(String(initialFilters.applicationDateStart)), to: undefined }
        : undefined
    );
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
      applicationDateStart: applicationDateRange?.from,
      applicationDateEnd: applicationDateRange?.to,
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
    setApplicationDateRange(undefined);
    setRecruiterId(ALL_RECRUITERS_SELECT_VALUE);
    setAiSearchQueryInput('');
    onFilterChange({
      minFitScore: 0,
      maxFitScore: 100,
      positionId: undefined,
      status: undefined,
      recruiterId: undefined,
      applicationDateStart: undefined,
      applicationDateEnd: undefined,
      aiSearchQuery: undefined,
    });
  };

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
            <Label htmlFor="position-select" className="text-xs">Position</Label>
            <Select value={positionId} onValueChange={(value) => setPositionId(value)} disabled={isLoading || isAiSearching}>
              <SelectTrigger id="position-select" className="w-full mt-1 text-xs">
                <SelectValue placeholder="All Positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_POSITIONS_SELECT_VALUE}>All Positions</SelectItem>
                {availablePositions.map(pos => <SelectItem key={pos.id} value={pos.id}>{pos.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status-select" className="text-xs">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as CandidateStatus | 'all')} disabled={isLoading || isAiSearching}>
              <SelectTrigger id="status-select" className="w-full mt-1 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUSES_SELECT_VALUE}>All Statuses</SelectItem>
                {availableStages.map(st => <SelectItem key={st.id} value={st.name}>{st.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="recruiter-select" className="text-xs">Assigned Recruiter</Label>
            <Select value={recruiterId} onValueChange={(value) => setRecruiterId(value)} disabled={isLoading || isAiSearching}>
              <SelectTrigger id="recruiter-select" className="w-full mt-1 text-xs">
                <SelectValue placeholder="All Recruiters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_RECRUITERS_SELECT_VALUE}>All Recruiters</SelectItem>
                {availableRecruiters.map(rec => <SelectItem key={rec.id} value={rec.id}>{rec.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
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
            <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs",
                      !applicationDateRange && "text-muted-foreground"
                    )}
                    disabled={isLoading || isAiSearching}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {applicationDateRange?.from ? (
                      applicationDateRange.to ? (
                        <>
                          {format(applicationDateRange.from, "LLL dd, y")} -{" "}
                          {format(applicationDateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(applicationDateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={applicationDateRange?.from}
                    selected={applicationDateRange}
                    onSelect={setApplicationDateRange}
                    numberOfMonths={2}
                    captionLayout="dropdown-buttons" 
                    fromYear={fromYear} 
                    toYear={toYear}
                  />
                </PopoverContent>
              </Popover>
         </div>
      )
    }
  ];

  return (
    <div className="space-y-4 p-1">
        <div>
            <Label htmlFor="ai-search-query" className="text-sm font-medium">AI Powered Search</Label>
            <Textarea
                id="ai-search-query"
                placeholder="e.g., 'Java developer with React skills and 5 years experience in fintech...'"
                value={aiSearchQueryInput}
                onChange={(e) => setAiSearchQueryInput(e.target.value)}
                disabled={isLoading || isAiSearching}
                className="mt-1 min-h-[80px]"
                rows={3}
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
