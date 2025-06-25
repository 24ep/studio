// src/components/candidates/CandidateDetailModal.tsx
"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Briefcase, Mail, Phone, Percent, Tag, CalendarDays, Info, UserCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import parseISO from 'date-fns/parseISO';
const getStatusBadgeVariant = (status) => {
    if (!status)
        return "outline";
    switch (status) {
        case 'Hired':
        case 'Offer Accepted': return 'default';
        case 'Interview Scheduled':
        case 'Interviewing':
        case 'Offer Extended': return 'secondary';
        case 'Rejected': return 'destructive';
        default: return 'outline';
    }
};
const renderModalField = (label, value, icon, isLink, linkHref) => {
    if (value === undefined || value === null || String(value).trim() === '')
        return null;
    const IconComponent = icon;
    const content = isLink && linkHref ? (<a href={linkHref} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
        {String(value)} <ExternalLink className="inline h-3 w-3 ml-1 opacity-70"/>
      </a>) : (<span className="text-foreground break-words">{String(value)}</span>);
    return (<div className="flex items-start text-sm py-1.5">
        {IconComponent && <IconComponent className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0"/>}
        <span className="font-medium text-muted-foreground mr-1 w-32 shrink-0">{label}:</span>
        {content}
      </div>);
};
export function CandidateDetailModal({ isOpen, onOpenChange, candidateSummary }) {
    var _a, _b, _c;
    const [fullCandidate, setFullCandidate] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchFullCandidate = useCallback(async (id) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/candidates/${id}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to fetch candidate details (Status: ${response.status})`);
            }
            const data = await response.json();
            setFullCandidate(data);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    useEffect(() => {
        if (isOpen && candidateSummary.id) {
            if (!fullCandidate || fullCandidate.id !== candidateSummary.id) {
                fetchFullCandidate(candidateSummary.id);
            }
        }
        if (!isOpen) {
            setFullCandidate(null);
            setError(null);
        }
    }, [isOpen, candidateSummary, fetchFullCandidate, fullCandidate]);
    const displayCandidate = fullCandidate || candidateSummary;
    const parsedDetails = displayCandidate.parsedData;
    const personalInfo = parsedDetails === null || parsedDetails === void 0 ? void 0 : parsedDetails.personal_info;
    return (<Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pt-6 px-6 pb-4 border-b">
          <DialogTitle className="text-2xl flex items-center">
             <Avatar className="h-10 w-10 mr-3 border-2 border-primary">
                <AvatarImage src={(personalInfo === null || personalInfo === void 0 ? void 0 : personalInfo.avatar_url) || `https://placehold.co/40x40.png?text=${((_a = displayCandidate.name) === null || _a === void 0 ? void 0 : _a.charAt(0)) || 'C'}`} alt={displayCandidate.name || "Candidate"} data-ai-hint="person avatar"/>
                <AvatarFallback>{((_b = displayCandidate.name) === null || _b === void 0 ? void 0 : _b.charAt(0).toUpperCase()) || 'C'}</AvatarFallback>
            </Avatar>
            {displayCandidate.name || "Candidate Details"}
          </DialogTitle>
           {displayCandidate.status && (<Badge variant={getStatusBadgeVariant(displayCandidate.status)} className="text-sm px-2 py-0.5 capitalize absolute top-7 right-16">
              {displayCandidate.status}
            </Badge>)}
        </DialogHeader>

        <ScrollArea className="flex-grow overflow-y-auto px-6 py-4">
            {isLoading && <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary"/> <p className="ml-2 text-muted-foreground">Loading full details...</p></div>}
            {error && <div className="text-destructive p-4 border border-destructive bg-destructive/10 rounded-md">{error}</div>}
            {!isLoading && !error && (<div className="space-y-5">
                    <section>
                        <h3 className="text-md font-semibold text-primary mb-2 flex items-center"><Info className="h-5 w-5 mr-2"/> Core Information</h3>
                        {renderModalField("Email", displayCandidate.email, Mail)}
                        {renderModalField("Phone", displayCandidate.phone, Phone)}
                        {renderModalField("Applied for", ((_c = displayCandidate.position) === null || _c === void 0 ? void 0 : _c.title) || 'N/A - General Application', Briefcase)}
                        {displayCandidate.fitScore !== undefined && renderModalField("Fit Score", `${displayCandidate.fitScore}%`, Percent)}
                        {displayCandidate.applicationDate && renderModalField("Application Date", format(parseISO(displayCandidate.applicationDate), "PPP"), CalendarDays)}
                        {renderModalField("CV Language", parsedDetails === null || parsedDetails === void 0 ? void 0 : parsedDetails.cv_language, Tag)}
                    </section>

                    {personalInfo && (<section>
                            <Separator className="my-3"/>
                            <h3 className="text-md font-semibold text-primary mb-2 flex items-center"><UserCircle className="h-5 w-5 mr-2"/> Personal Details</h3>
                            {renderModalField("First Name", personalInfo.firstname)}
                            {renderModalField("Last Name", personalInfo.lastname)}
                            {renderModalField("Title", personalInfo.title_honorific)}
                            {renderModalField("Nickname", personalInfo.nickname)}
                            {renderModalField("Location", personalInfo.location)}
                            {personalInfo.introduction_aboutme && (<div className="mt-1.5">
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">About Me:</h4>
                                    <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 p-2.5 rounded-md">{personalInfo.introduction_aboutme}</p>
                                </div>)}
                        </section>)}
                     <div className="text-center pt-2">
                        <Button variant="link" asChild>
                            <Link href={`/candidates/${displayCandidate.id}`}>View Full Profile <ExternalLink className="h-4 w-4 ml-1.5"/></Link>
                        </Button>
                    </div>
                </div>)}
        </ScrollArea>
        
        <DialogFooter className="p-6 pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
