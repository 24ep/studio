"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandList, CommandItem } from '@/components/ui/command';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Search, FilterX, Check, ChevronsUpDown, Loader2, CalendarIcon, Brain, Users, Briefcase, Tag, Star, Building, ListFilter, Zap, Target, Lightbulb, Sparkles } from 'lucide-react';
import type { Position, CandidateStatus, RecruitmentStage, UserProfile } from '@/lib/types';
import { cn } from "@/lib/utils";
import { ScrollArea } from '../ui/scroll-area';
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import parseISO from 'date-fns/parseISO';
import type { DateRange } from "react-day-picker";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  aiSearchType?: 'semantic' | 'exact' | 'hybrid';
  aiSearchFilters?: {
    positionIds?: string[];
    statuses?: string[];
    minFitScore?: number;
    maxFitScore?: number;
    dateRange?: {
      start: string;
      end: string;
    };
  };
}

interface CandidateFiltersProps {
  initialFilters?: CandidateFilterValues;
  onFilterChange: (filters: CandidateFilterValues) => void;
  onAiSearch: (aiQuery: string, searchType?: string, filters?: any) => void;
  availablePositions: Position[];
  availableStages: RecruitmentStage[];
  availableRecruiters: Pick<UserProfile, 'id' | 'name'>[];
  isLoading?: boolean;
  isAiSearching?: boolean;
  aiSearchResults?: {
    totalFound: number;
    searchQuery: string;
    searchType: string;
    reasoning: string;
  };
}

export function CandidateFilters({
    initialFilters = {},
    onFilterChange,
    onAiSearch,
    availablePositions,
    availableStages,
    availableRecruiters,
    isLoading,
    isAiSearching,
    aiSearchResults
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
  const [aiSearchType, setAiSearchType] = useState<'semantic' | 'exact' | 'hybrid'>(initialFilters.aiSearchType || 'hybrid');
  const [aiSearchFilters, setAiSearchFilters] = useState(initialFilters.aiSearchFilters || {});

  const [positionSearch, setPositionSearch] = useState('');
  const [statusSearch, setStatusSearch] = useState('');
  const [recruiterSearch, setRecruiterSearch] = useState('');
  
  const [positionPopoverOpen, setPositionPopoverOpen] = useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [recruiterPopoverOpen, setRecruiterPopoverOpen] = useState(false);

  // AI Search examples
  const aiSearchExamples = [
    "React developers with 5+ years experience",
    "Python developers who worked at Google or Microsoft",
    "Marketing managers with MBA from top universities",
    "Senior engineers with machine learning experience",
    "Sales professionals with SaaS background",
    "Designers with portfolio in fintech",
    "Product managers with agile experience",
    "Data scientists with PhD in statistics",
  ];

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
    setAiSearchType(initialFilters.aiSearchType || 'hybrid');
    setAiSearchFilters(initialFilters.aiSearchFilters || {});
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
      const filters = {
        positionIds: aiSearchFilters.positionIds,
        statuses: aiSearchFilters.statuses,
        minFitScore: aiSearchFilters.minFitScore,
        maxFitScore: aiSearchFilters.maxFitScore,
        dateRange: aiSearchFilters.dateRange,
      };
      onAiSearch(aiSearchQueryInput.trim(), aiSearchType, filters);
    }
  };

  const handleAiSearchExample = (example: string) => {
    setAiSearchQueryInput(example);
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
    setAiSearchType('hybrid');
    setAiSearchFilters({});
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
    if (selectedItems.size === 0) return <span>{placeholder}</span>;
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
      return <span>{itemName}</span>;
    }
    return <span>{`${selectedItems.size} selected`}</span>;
  };

  // Defensive defaults for arrays
  const safeAvailablePositions = Array.isArray(availablePositions) ? availablePositions : [];
  const safeAvailableStages = Array.isArray(availableStages) ? availableStages : [];
  const safeAvailableRecruiters = Array.isArray(availableRecruiters) ? availableRecruiters : [];

  const filteredPositions = safeAvailablePositions.filter(pos => pos.title.toLowerCase().includes(positionSearch.toLowerCase()));
  const filteredStages = safeAvailableStages.filter(stage => stage.name.toLowerCase().includes(statusSearch.toLowerCase()));
  const filteredRecruiters = safeAvailableRecruiters.filter(rec => rec.name.toLowerCase().includes(recruiterSearch.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* AI Search Section */}
      <div className="rounded-lg shadow flex flex-col gap-4  border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold">AI Candidate Search</h3>
            <Tooltip>
              <TooltipTrigger>
                <Lightbulb className="w-4 h-4 text-muted-foreground ml-1" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Use natural language to search across all candidate attributes including skills, experience, education, and parsed resume data.
                </p>
              </TooltipContent>
            </Tooltip>
        </div>
        <Textarea
          id="ai-search"
          placeholder="e.g., 'React developers with 5+ years experience at tech companies'"
          value={aiSearchQueryInput}
          onChange={(e) => setAiSearchQueryInput(e.target.value)}
          className="min-h-[80px] text-base"
          disabled={isLoading || isAiSearching}
        />
        <Button
          onClick={handleAiSearchClick}
          disabled={!aiSearchQueryInput.trim() || isLoading || isAiSearching}
          className="w-full md:w-auto mt-2 md:mt-0"
          size="lg"
        >
          {isAiSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              AI Search
            </>
          )}
        </Button>
        {aiSearchResults && (
          <Card className="bg-muted/50 mt-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Search Results
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Found:</span>
                  <Badge variant="secondary">{aiSearchResults.totalFound} candidates</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  <strong>Query:</strong> &quot;{aiSearchResults.searchQuery}&quot;
                </div>
                <div className="text-xs text-muted-foreground">
                  <strong>Type:</strong> {aiSearchResults.searchType}
                </div>
                <div className="text-xs text-muted-foreground">
                  <strong>Reasoning:</strong> {aiSearchResults.reasoning}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2 my-2">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground font-medium">Or filter by attributes</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* Attribute Filters Section */}
      <div className="grid grid-cols-1 gap-4">
        {/* Basic Info */}
        <div>
          <Label htmlFor="name-search" className="text-xs">Name</Label>
          <Input id="name-search" placeholder="Filter by name..." value={name} onChange={(e) => setName(e.target.value)} className="mt-1" disabled={isLoading || isAiSearching}/>
        </div>
        <div>
          <Label htmlFor="email-search" className="text-xs">Email</Label>
          <Input id="email-search" placeholder="Filter by email..." value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" disabled={isLoading || isAiSearching}/>
        </div>
        <div>
          <Label htmlFor="phone-search" className="text-xs">Phone</Label>
          <Input id="phone-search" placeholder="Filter by phone..." value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" disabled={isLoading || isAiSearching}/>
        </div>
        {/* Job Details */}
        <div>
          <Label htmlFor="position-select" className="text-xs">Position(s)</Label>
          <Popover open={positionPopoverOpen} onOpenChange={setPositionPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={positionPopoverOpen}
                className="w-full justify-between mt-1"
                disabled={isLoading || isAiSearching}
              >
                {renderMultiSelectTrigger("Select positions...", selectedPositionIds, safeAvailablePositions, 'position')}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search positions..." value={positionSearch} onChange={e => setPositionSearch(e.target.value)} />
                <CommandList>
                  <CommandEmpty>No position found.</CommandEmpty>
                  {filteredPositions.map((position) => (
                    <CommandItem
                      key={position.id}
                      onSelect={() => {
                        const newSelected = new Set(selectedPositionIds);
                        if (newSelected.has(position.id)) {
                          newSelected.delete(position.id);
                        } else {
                          newSelected.add(position.id);
                        }
                        setSelectedPositionIds(newSelected);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedPositionIds.has(position.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {position.title}
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label htmlFor="status-select" className="text-xs">Status(es)</Label>
          <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={statusPopoverOpen}
                className="w-full justify-between mt-1"
                disabled={isLoading || isAiSearching}
              >
                {renderMultiSelectTrigger("Select statuses...", selectedStatuses, safeAvailableStages, 'status')}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search statuses..." value={statusSearch} onChange={e => setStatusSearch(e.target.value)} />
                <CommandList>
                  <CommandEmpty>No status found.</CommandEmpty>
                  {filteredStages.map((stage) => (
                    <CommandItem
                      key={stage.name}
                      onSelect={() => {
                        const newSelected = new Set(selectedStatuses);
                        if (newSelected.has(stage.name)) {
                          newSelected.delete(stage.name);
                        } else {
                          newSelected.add(stage.name);
                        }
                        setSelectedStatuses(newSelected);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedStatuses.has(stage.name) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {stage.name}
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        {/* Advanced Filters */}
        <div>
          <Label htmlFor="education-search" className="text-xs">Education Keywords</Label>
          <Input id="education-search" placeholder="e.g., MBA, Computer Science..." value={education} onChange={(e) => setEducation(e.target.value)} className="mt-1" disabled={isLoading || isAiSearching}/>
        </div>
        <div>
          <Label className="text-xs">Fit Score Range</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={fitScoreRange}
              onValueChange={val => setFitScoreRange([val[0], val[1]])}
              max={100}
              step={1}
              className="flex-1"
              disabled={isLoading || isAiSearching}
            />
            <span className="text-xs w-16">
              {fitScoreRange[0]}-{fitScoreRange[1]}
            </span>
          </div>
        </div>
        <div>
          <Label className="text-xs">Application Date Range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-1",
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
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label htmlFor="recruiter-select" className="text-xs">Assigned Recruiter(s)</Label>
          <Popover open={recruiterPopoverOpen} onOpenChange={setRecruiterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={recruiterPopoverOpen}
                className="w-full justify-between mt-1"
                disabled={isLoading || isAiSearching}
              >
                {renderMultiSelectTrigger("Select recruiters...", selectedRecruiterIds, safeAvailableRecruiters, 'recruiter')}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search recruiters..." value={recruiterSearch} onChange={e => setRecruiterSearch(e.target.value)} />
                <CommandList>
                  <CommandEmpty>No recruiter found.</CommandEmpty>
                  {filteredRecruiters.map((recruiter) => (
                    <CommandItem
                      key={recruiter.id}
                      onSelect={() => {
                        const newSelected = new Set(selectedRecruiterIds);
                        if (newSelected.has(recruiter.id)) {
                          newSelected.delete(recruiter.id);
                        } else {
                          newSelected.add(recruiter.id);
                        }
                        setSelectedRecruiterIds(newSelected);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedRecruiterIds.has(recruiter.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {recruiter.name}
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <Button
          onClick={handleApplyStandardFilters}
          disabled={isLoading || isAiSearching}
          className="flex-1"
        >
          <Search className="mr-2 h-4 w-4" />
          Apply Filters
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetFilters}
          disabled={isLoading || isAiSearching}
        >
          Reset All
        </Button>
      </div>
    </div>
  );
}

