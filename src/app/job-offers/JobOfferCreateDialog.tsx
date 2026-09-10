"use client";

import { FileSignature, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ApplicantOption {
  id: string;
  name: string;
  email: string;
  positionId: string | null;
}

export interface PositionOption {
  id: string;
  title: string;
  department: string;
}

export interface OfferForm {
  applicantId: string;
  positionId: string;
  recipientName: string;
  recipientEmail: string;
  jobTitle: string;
  salaryAmount: string;
  currency: string;
  startDate: string;
}

export const emptyOfferForm: OfferForm = {
  applicantId: '',
  positionId: '',
  recipientName: '',
  recipientEmail: '',
  jobTitle: '',
  salaryAmount: '',
  currency: 'THB',
  startDate: '',
};

export function JobOfferCreateDialog({
  applicants,
  form,
  onCreate,
  onFormChange,
  onOpenChange,
  open,
  positions,
  saving,
}: {
  applicants: ApplicantOption[];
  form: OfferForm;
  onCreate: (sendNow?: boolean) => Promise<void>;
  onFormChange: (form: OfferForm) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  positions: PositionOption[];
  saving: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        <DialogHeader className="border-b bg-muted/25 px-6 py-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <FileSignature className="h-4 w-4" /> New candidate offer
          </div>
          <DialogTitle className="text-xl tracking-tight">Prepare the offer details</DialogTitle>
          <p className="text-sm leading-5 text-muted-foreground">Select a candidate to prefill their details, then review the package before sending.</p>
        </DialogHeader>
        <div className="grid max-h-[65vh] gap-5 overflow-y-auto px-6 py-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="offer-applicant">Applicant</Label>
            <select
              id="offer-applicant"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.applicantId}
              onChange={(event) => onFormChange({ ...form, applicantId: event.target.value })}
            >
              <option value="">Create a manual offer</option>
              {applicants.map((applicant) => (
                <option key={applicant.id} value={applicant.id}>{applicant.name} / {applicant.email}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Candidate details and their linked position will be filled automatically.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="offer-name">Candidate name</Label>
            <Input id="offer-name" value={form.recipientName} onChange={(event) => onFormChange({ ...form, recipientName: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="offer-email">Email address</Label>
            <Input id="offer-email" type="email" value={form.recipientEmail} onChange={(event) => onFormChange({ ...form, recipientEmail: event.target.value })} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="offer-position">Linked position</Label>
            <select
              id="offer-position"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.positionId}
              onChange={(event) => {
                const position = positions.find((item) => item.id === event.target.value);
                onFormChange({ ...form, positionId: event.target.value, jobTitle: position?.title || form.jobTitle });
              }}
            >
              <option value="">No linked position</option>
              {positions.map((position) => (
                <option key={position.id} value={position.id}>{position.title} / {position.department}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="offer-title">Job title</Label>
            <Input id="offer-title" value={form.jobTitle} onChange={(event) => onFormChange({ ...form, jobTitle: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="offer-salary">Annual salary</Label>
            <div className="flex gap-2">
              <Input id="offer-salary" className="min-w-0 flex-1" type="number" min="0" placeholder="0" value={form.salaryAmount} onChange={(event) => onFormChange({ ...form, salaryAmount: event.target.value })} />
              <Input aria-label="Currency" className="w-20 text-center font-medium uppercase" value={form.currency} maxLength={3} onChange={(event) => onFormChange({ ...form, currency: event.target.value.toUpperCase() })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="offer-start-date">Proposed start date</Label>
            <Input id="offer-start-date" type="date" value={form.startDate} onChange={(event) => onFormChange({ ...form, startDate: event.target.value })} />
          </div>
        </div>
        <DialogFooter className="flex-col-reverse gap-2 border-t bg-muted/20 px-6 py-4 sm:flex-row sm:justify-between sm:space-x-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => void onCreate(false)} disabled={saving}>
              Save as draft
            </Button>
            <Button onClick={() => void onCreate(true)} disabled={saving}>
              <Mail className="mr-2 h-4 w-4" />
              Create and send
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
