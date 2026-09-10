"use client";

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Info,
  Loader2,
  Search,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type EmployeeCandidate = {
  id: string;
  name: string;
  employeeNumber: string;
  email: string;
  department: string;
  jobTitle: string;
  accountUserId?: string | null;
};

interface CreateUserAccountFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateStandalone: (values: import('./UnifiedUserModal').UnifiedUserFormValues) => Promise<void>;
  roles: Array<{ id: string; name: string }>;
  onAccountCreated: () => void;
}

export function CreateUserAccountFlow({
  open,
  onOpenChange,
  onCreateStandalone,
  roles,
  onAccountCreated,
}: CreateUserAccountFlowProps) {
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [standaloneDialogOpen, setStandaloneDialogOpen] = useState(false);

  const chooseEmployee = () => {
    onOpenChange(false);
    setEmployeeDialogOpen(true);
  };

  const chooseStandalone = () => {
    onOpenChange(false);
    setStandaloneDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="gap-0 overflow-hidden border-border bg-background p-0 sm:max-w-[700px]">
          <DialogHeader className="px-8 pb-5 pt-7 text-left">
            <DialogTitle className="text-2xl font-semibold tracking-tight">Create user account</DialogTitle>
            <DialogDescription className="mt-1 text-sm">Choose how you want to create this account.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 px-8 pb-6">
            <AccountSourceButton
              icon={UsersRound}
              title="Link an employee"
              description="Create access for an existing employee profile."
              onClick={chooseEmployee}
            />
            <AccountSourceButton
              icon={UserPlus}
              title="Create without employee"
              description="Create a standalone account for an admin, contractor, or service user."
              onClick={chooseStandalone}
            />
            <p className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 text-primary" />
              You can&apos;t change the account source after creation.
            </p>
          </div>

          <div className="flex justify-end border-t border-border px-8 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      <EmployeeAccountDialog
        open={employeeDialogOpen}
        onOpenChange={setEmployeeDialogOpen}
        onBack={() => {
          setEmployeeDialogOpen(false);
          onOpenChange(true);
        }}
        onAccountCreated={() => {
          setEmployeeDialogOpen(false);
          onAccountCreated();
        }}
      />
      <StandaloneAccountDialog
        open={standaloneDialogOpen}
        onOpenChange={setStandaloneDialogOpen}
        roles={roles}
        onBack={() => {
          setStandaloneDialogOpen(false);
          onOpenChange(true);
        }}
        onCreate={async values => {
          await onCreateStandalone(values);
          setStandaloneDialogOpen(false);
          onAccountCreated();
        }}
      />
    </>
  );
}

function StandaloneAccountDialog({ open, onOpenChange, onBack, onCreate, roles }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack: () => void;
  onCreate: (values: import('./UnifiedUserModal').UnifiedUserFormValues) => Promise<void>;
  roles: Array<{ id: string; name: string }>;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Admin');
  const [sendSetupEmail, setSendSetupEmail] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setEmail('');
    setRole(roles.find(option => option.name.toLocaleLowerCase().includes('admin'))?.name || roles[0]?.name || 'Admin');
    setSendSetupEmail(true);
  }, [open, roles]);

  const valid = name.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && role.length > 0;
  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        email: email.trim(),
        password: '',
        role,
        newPassword: '',
        forcePasswordChange: sendSetupEmail,
        authenticationMethods: ['basic'],
        userTeamIds: [],
        userGroupIds: [],
        avatarUrl: '',
        personalColor: '#3B82F6',
        positionTitle: '',
        department: '',
        phoneNumber: '',
        officeLocation: '',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border-border bg-background p-0 sm:max-w-[680px]">
        <DialogHeader className="border-b border-border px-7 pb-5 pt-6 text-left">
          <button type="button" onClick={onBack} className="mb-3 inline-flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Account source
          </button>
          <DialogTitle className="text-xl font-semibold">Create without employee</DialogTitle>
          <DialogDescription>Create a standalone account for an admin, contractor, or service user.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-7 py-6">
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Full name</span>
            <input value={name} onChange={event => setName(event.target.value)} placeholder="Enter full name" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Login email</span>
            <input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Enter work email address" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Role</span>
            <select value={role} onChange={event => setRole(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
              {(roles.length ? roles : [{ id: 'admin', name: 'Admin' }, { id: 'employee', name: 'Employee' }]).map(option => <option key={option.id} value={option.name}>{option.name}</option>)}
            </select>
          </label>
          <label className="flex cursor-pointer items-start gap-3 border-t border-border pt-4">
            <Checkbox checked={sendSetupEmail} onCheckedChange={checked => setSendSetupEmail(checked === true)} />
            <span className="text-sm"><span className="block font-medium">Send setup email</span><span className="mt-0.5 block text-xs text-muted-foreground">Send password setup instructions to the new user.</span></span>
          </label>
          <p className="flex items-center gap-2 rounded-md border border-primary/25 bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground"><Info className="h-4 w-4 shrink-0 text-primary" /> This account will not be linked to an employee profile.</p>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-7 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={!valid || submitting} onClick={() => void submit()}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AccountSourceButton({ icon: Icon, title, description, onClick }: {
  icon: typeof UsersRound;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-5 rounded-md border border-border px-5 py-5 text-left transition-colors hover:border-primary/70 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center text-muted-foreground group-hover:text-primary">
        <Icon className="h-8 w-8" strokeWidth={1.6} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-foreground">{title}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </button>
  );
}

function EmployeeAccountDialog({ open, onOpenChange, onBack, onAccountCreated }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack: () => void;
  onAccountCreated: () => void;
}) {
  const [employees, setEmployees] = useState<EmployeeCandidate[]>([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    void fetch('/api/hr/employees', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Unable to load employees.');
        return response.json() as Promise<{ resource?: unknown[] }>;
      })
      .then(payload => {
        if (!active) return;
        const candidates = (Array.isArray(payload.resource) ? payload.resource : []).map(normalizeEmployee);
        setEmployees(candidates);
        setSelectedId(candidates.find(employee => !employee.accountUserId)?.id ?? null);
      })
      .catch(error => {
        if (active) toast.error(error instanceof Error ? error.message : 'Unable to load employees.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open]);

  const filteredEmployees = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return employees;
    return employees.filter(employee =>
      `${employee.name} ${employee.employeeNumber} ${employee.email} ${employee.department} ${employee.jobTitle}`
        .toLocaleLowerCase()
        .includes(normalized),
    );
  }, [employees, query]);
  const selectedEmployee = employees.find(employee => employee.id === selectedId) ?? null;

  const createAccount = async () => {
    if (!selectedEmployee || selectedEmployee.accountUserId || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/hr/employees/${encodeURIComponent(selectedEmployee.id)}/system-account`, {
        method: 'POST',
        credentials: 'include',
      });
      const payload = await response.json().catch(() => null) as { message?: string; account?: { setupEmail?: { sent?: boolean } } } | null;
      if (!response.ok) throw new Error(payload?.message || 'Unable to create the employee account.');
      toast.success(payload?.account?.setupEmail?.sent === false
        ? 'Account created. The setup email could not be sent.'
        : 'Employee account created and setup instructions sent.');
      onAccountCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create the employee account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[82vh] flex-col gap-0 overflow-hidden border-border bg-background p-0 sm:max-w-[820px]">
        <DialogHeader className="border-b border-border px-7 pb-5 pt-6 text-left">
          <button type="button" onClick={onBack} className="mb-3 inline-flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Account source
          </button>
          <DialogTitle className="text-xl font-semibold">Link an employee</DialogTitle>
          <DialogDescription>Select an employee who does not already have a platform account.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-7 py-5">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              aria-label="Search employees"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search by name, employee ID, or email"
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <div className="overflow-hidden rounded-md border border-border">
            {loading ? (
              <div className="grid min-h-48 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : filteredEmployees.length ? filteredEmployees.map(employee => {
              const disabled = Boolean(employee.accountUserId);
              const selected = employee.id === selectedId;
              return (
                <button
                  key={employee.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelectedId(employee.id)}
                  className={cn(
                    'grid w-full grid-cols-[28px_minmax(0,1.4fr)_minmax(0,1fr)_120px] items-center gap-3 border-b border-border px-4 py-3 text-left last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                    selected && 'bg-primary/10',
                    disabled ? 'cursor-not-allowed opacity-45' : 'hover:bg-muted/40',
                  )}
                >
                  <span className={cn('h-4 w-4 rounded-full border', selected ? 'border-[5px] border-primary' : 'border-muted-foreground')} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{employee.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{employee.employeeNumber} · {employee.email || 'No work email'}</span>
                  </span>
                  <span className="min-w-0 text-xs text-muted-foreground">
                    <span className="block truncate">{employee.department}</span>
                    <span className="block truncate">{employee.jobTitle}</span>
                  </span>
                  <span className={cn('text-right text-xs font-medium', disabled ? 'text-muted-foreground' : 'text-emerald-500')}>
                    {disabled ? 'Account exists' : 'Eligible'}
                  </span>
                </button>
              );
            }) : (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">No employees match your search.</p>
            )}
          </div>

          {selectedEmployee && (
            <div className="flex items-center justify-between gap-4 border-t border-border pt-4 text-sm">
              <div>
                <p className="font-semibold">{selectedEmployee.name}</p>
                <p className="text-xs text-muted-foreground">Account will use {selectedEmployee.email || 'the employee work email'}</p>
              </div>
              <span className="text-xs text-muted-foreground">Default role: Employee</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-7 py-4">
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><Info className="h-4 w-4 text-primary" /> Existing accounts are disabled to prevent duplicates.</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="button" disabled={!selectedEmployee || Boolean(selectedEmployee.accountUserId) || submitting} onClick={() => void createAccount()}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create linked account
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function normalizeEmployee(value: unknown): EmployeeCandidate {
  const employee = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const name = String(employee.name || employee.fullName || employee.legalName || [employee.firstName, employee.lastName].filter(Boolean).join(' ') || 'Unnamed employee');
  return {
    id: String(employee.id || ''),
    name,
    employeeNumber: String(employee.employeeNumber || employee.employeeId || 'No employee ID'),
    email: String(employee.email || employee.workEmail || employee.accountEmail || ''),
    department: String(employee.departmentName || employee.department || 'No department'),
    jobTitle: String(employee.positionTitle || employee.jobTitle || employee.designationName || 'No job title'),
    accountUserId: employee.accountUserId ? String(employee.accountUserId) : null,
  };
}
