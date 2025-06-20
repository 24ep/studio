
"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandList, CommandItem } from '@/components/ui/command';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Search, FilterX, Check, ChevronsUpDown, Loader2, CalendarIcon, Brain, Users, Briefcase, Tag, Star, Building, ListFilter } from 'lucide-react';
import type { Position, CandidateStatus, RecruitmentStage, UserProfile } from '@/lib/types';
import { cn } from "@/lib/utils";
import { ScrollArea } from '../ui/scroll-area';
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from 'date-fns';
import type { DateRange } from "react-day-picker";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from '@/components/ui/textarea';


export interface CandidateFilterValues {
  name?: string;
  email?: string;
  phone?: string;
  selectedPositionIds?: string[];
  selectedStatuses?: string[];
  education?: string; // Education Keywords
  minFitScore?: number;
  maxFitScore?: number;
  applicationDateStart?: Date;
  applicationDateEnd?: Date;
  selectedRecruiterIds?: string[];
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
  const [selectedPositionIds, setSelectedPositionIds] = useState<Set<string>>(new Set(initialFilters.selectedPositionIds || []));
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set(initialFilters.selectedStatuses || []));
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

  const [selectedRecruiterIds, setSelectedRecruiterIds] = useState<Set<string>>(new Set(initialFilters.selectedRecruiterIds || []));
  const [aiSearchQueryInput, setAiSearchQueryInput] = useState(initialFilters.aiSearchQuery || '');

  const [positionSearch, setPositionSearch] = useState('');
  const [statusSearch, setStatusSearch] = useState('');
  const [recruiterSearch, setRecruiterSearch] = useState('');
  
  const [positionPopoverOpen, setPositionPopoverOpen] = useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [recruiterPopoverOpen, setRecruiterPopoverOpen] = useState(false);


  const currentYear = new Date().getFullYear();
  const fromYear = currentYear - 10;
  const toYear = currentYear + 1;

  useEffect(() => {
    setName(initialFilters.name || '');
    setEmail(initialFilters.email || '');
    setPhone(initialFilters.phone || '');
    setSelectedPositionIds(new Set(initialFilters.selectedPositionIds || []));
    setSelectedStatuses(new Set(initialFilters.selectedStatuses || []));
    setEducation(initialFilters.education || '');
    setFitScoreRange([initialFilters.minFitScore || 0, initialFilters.maxFitScore || 100]);
    setApplicationDateRange(
      initialFilters.applicationDateStart && initialFilters.applicationDateEnd
        ? { from: parseISO(String(initialFilters.applicationDateStart)), to: parseISO(String(initialFilters.applicationDateEnd)) }
        : initialFilters.applicationDateStart
        ? { from: parseISO(String(initialFilters.applicationDateStart)), to: undefined }
        : undefined
    );
    setSelectedRecruiterIds(new Set(initialFilters.selectedRecruiterIds || []));
    setAiSearchQueryInput(initialFilters.aiSearchQuery || '');
  }, [initialFilters]);


  const handleApplyStandardFilters = () => {
    onFilterChange({
      name: name || undefined,
      email: email || undefined,
      phone: phone || undefined,
      selectedPositionIds: selectedPositionIds.size > 0 ? Array.from(selectedPositionIds) : undefined,
      selectedStatuses: selectedStatuses.size > 0 ? Array.from(selectedStatuses) : undefined,
      education: education || undefined,
      minFitScore: fitScoreRange[0],
      maxFitScore: fitScoreRange[1],
      applicationDateStart: applicationDateRange?.from,
      applicationDateEnd: applicationDateRange?.to,
      selectedRecruiterIds: selectedRecruiterIds.size > 0 ? Array.from(selectedRecruiterIds) : undefined,
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
    setSelectedPositionIds(new Set());
    setSelectedStatuses(new Set());
    setEducation('');
    setFitScoreRange([0, 100]);
    setApplicationDateRange(undefined);
    setSelectedRecruiterIds(new Set());
    setAiSearchQueryInput('');
    onFilterChange({
      minFitScore: 0,
      maxFitScore: 100,
      selectedPositionIds: undefined,
      selectedStatuses: undefined,
      selectedRecruiterIds: undefined,
      applicationDateStart: undefined,
      applicationDateEnd: undefined,
      aiSearchQuery: undefined,
    });
  };
  
  const renderMultiSelectTrigger = (placeholder: string, selectedItems: Set<string>, allItems: {id: string; title?: string; name?: string}[], itemType: 'position' | 'status' | 'recruiter') => {
    if (selectedItems.size === 0) return placeholder;
    if (selectedItems.size === 1) {
      const firstId = Array.from(selectedItems)[0];
      let itemName = '';
      if (itemType === 'position') {
        itemName = (allItems as Position[]).find(p => p.id === firstId)?.title || placeholder;
      } else if (itemType === 'status') {
        itemName = (allItems as RecruitmentStage[]).find(s => s.name === firstId)?.name || placeholder;
      } else if (itemType === 'recruiter') {
        itemName = (allItems as UserProfile[]).find(r => r.id === firstId)?.name || placeholder;
      }
      return itemName;
    }
    return `${selectedItems.size} selected`;
  };

  const filteredPositions = availablePositions.filter(pos => pos.title.toLowerCase().includes(positionSearch.toLowerCase()));
  const filteredStages = availableStages.filter(stage => stage.name.toLowerCase().includes(statusSearch.toLowerCase()));
  const filteredRecruiters = availableRecruiters.filter(rec => rec.name.toLowerCase().includes(recruiterSearch.toLowerCase()));


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
            <Label htmlFor="position-select" className="text-xs">Position(s)</Label>
            <Popover open={positionPopoverOpen} onOpenChange={setPositionPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={positionPopoverOpen} className="w-full mt-1 justify-between text-xs font-normal">
                        {renderMultiSelectTrigger("Select position(s)...", selectedPositionIds, availablePositions, 'position')}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--trigger-width] p-0 dropdown-content-height">
                    <Command>
                        <CommandInput placeholder="Search positions..." value={positionSearch} onValueChange={setPositionSearch} className="h-9 text-xs" />
                        <CommandList>
                            <CommandEmpty>{positionSearch ? 'No positions found.' : 'Type to search positions.'}</CommandEmpty>
                            <ScrollArea className="max-h-48">
                            {filteredPositions.map((pos) => (
                                <CommandItem
                                    key={pos.id}
                                    value={pos.title}
                                    onSelect={() => {
                                        setSelectedPositionIds(prev => {
                                            const newSet = new Set(prev);
                                            if (newSet.has(pos.id)) newSet.delete(pos.id);
                                            else newSet.add(pos.id);
                                            return newSet;
                                        });
                                        // setPositionPopoverOpen(false); // Keep open for multi-select
                                    }}
                                    className="text-xs"
                                >
                                    <Check className={cn("mr-2 h-4 w-4", selectedPositionIds.has(pos.id) ? "opacity-100" : "opacity-0")}/>
                                    {pos.title}
                                </CommandItem>
                            ))}
                            </ScrollArea>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="status-select" className="text-xs">Status(es)</Label>
            <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={statusPopoverOpen} className="w-full mt-1 justify-between text-xs font-normal">
                        {renderMultiSelectTrigger("Select status(es)...", selectedStatuses, availableStages, 'status')}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--trigger-width] p-0 dropdown-content-height">
                    <Command>
                        <CommandInput placeholder="Search statuses..." value={statusSearch} onValueChange={setStatusSearch} className="h-9 text-xs" />
                        <CommandList>
                            <CommandEmpty>{statusSearch ? 'No statuses found.' : 'Type to search statuses.'}</CommandEmpty>
                            <ScrollArea className="max-h-48">
                            {filteredStages.map((stage) => (
                                <CommandItem
                                    key={stage.id}
                                    value={stage.name}
                                    onSelect={() => {
                                        setSelectedStatuses(prev => {
                                            const newSet = new Set(prev);
                                            if (newSet.has(stage.name)) newSet.delete(stage.name);
                                            else newSet.add(stage.name);
                                            return newSet;
                                        });
                                    }}
                                    className="text-xs"
                                >
                                    <Check className={cn("mr-2 h-4 w-4", selectedStatuses.has(stage.name) ? "opacity-100" : "opacity-0")}/>
                                    {stage.name}
                                </CommandItem>
                            ))}
                            </ScrollArea>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="recruiter-select" className="text-xs">Assigned Recruiter(s)</Label>
            <Popover open={recruiterPopoverOpen} onOpenChange={setRecruiterPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={recruiterPopoverOpen} className="w-full mt-1 justify-between text-xs font-normal">
                        {renderMultiSelectTrigger("Select recruiter(s)...", selectedRecruiterIds, availableRecruiters, 'recruiter')}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--trigger-width] p-0 dropdown-content-height">
                    <Command>
                        <CommandInput placeholder="Search recruiters..." value={recruiterSearch} onValueChange={setRecruiterSearch} className="h-9 text-xs" />
                         <CommandList>
                           <CommandEmpty>{recruiterSearch ? 'No recruiters found.' : 'Type to search recruiters.'}</CommandEmpty>
                            <ScrollArea className="max-h-48">
                            {filteredRecruiters.map((rec) => (
                                <CommandItem
                                    key={rec.id}
                                    value={rec.name}
                                    onSelect={() => {
                                        setSelectedRecruiterIds(prev => {
                                            const newSet = new Set(prev);
                                            if (newSet.has(rec.id)) newSet.delete(rec.id);
                                            else newSet.add(rec.id);
                                            return newSet;
                                        });
                                    }}
                                    className="text-xs"
                                >
                                    <Check className={cn("mr-2 h-4 w-4", selectedRecruiterIds.has(rec.id) ? "opacity-100" : "opacity-0")}/>
                                    {rec.name}
                                </CommandItem>
                            ))}
                            </ScrollArea>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
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

