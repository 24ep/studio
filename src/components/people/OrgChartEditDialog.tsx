"use client";

import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { DepartmentUnit } from './department-hierarchy-utils';
import { EmployeeOption } from '@/components/hr/EmployeeOption';

export interface OrgChartEmployee {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  jobTitle?: string | null;
  status?: string | null;
  location?: string | null;
  managerId?: string | null;
  departmentId?: string | null;
  avatarUrl?: string | null;
}

export interface OrgChartPosition {
  id: string;
  title?: string | null;
  department?: string | null;
  positionLevel?: string | null;
  isOpen?: boolean | null;
  organizationUnitId?: string | null;
}

export type OrgChartEditTarget =
  | { type: 'employee'; employee: OrgChartEmployee }
  | { type: 'position'; position: OrgChartPosition }
  | { type: 'division'; id: string; name: string; headcountAllocation: number | null; headcountUsage: number }
  | { type: 'department'; id: string; division: string; name: string; headcountAllocation: number | null; headcountUsage: number };

interface EditForm {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  status: string;
  location: string;
  managerId: string;
  departmentId: string;
  title: string;
  department: string;
  positionLevel: string;
  isOpen: string;
  organizationName: string;
  headcountAllocation: string;
  organizationUnitId: string;
}

const EMPTY_FORM: EditForm = {
  firstName: '',
  lastName: '',
  email: '',
  jobTitle: '',
  status: 'active',
  location: '',
  managerId: 'none',
  departmentId: 'none',
  title: '',
  department: '',
  positionLevel: '',
  isOpen: 'true',
  organizationName: '',
  headcountAllocation: '',
  organizationUnitId: 'none',
};

export function OrgChartEditDialog({
  target,
  employees,
  units,
  onOpenChange,
  onSaved,
}: {
  target: OrgChartEditTarget | null;
  employees: OrgChartEmployee[];
  units: DepartmentUnit[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void> | void;
}) {
  const { error: toastError, success: toastSuccess } = useToast();
  const [form, setForm] = React.useState<EditForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!target) return;
    if (target.type === 'employee') {
      const employee = target.employee;
      setForm({
        ...EMPTY_FORM,
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        jobTitle: employee.jobTitle || '',
        status: employee.status || 'active',
        location: employee.location || '',
        managerId: employee.managerId || 'none',
        departmentId: employee.departmentId || 'none',
      });
    } else if (target.type === 'position') {
      setForm({
        ...EMPTY_FORM,
        title: target.position.title || '',
        department: target.position.department || '',
        positionLevel: target.position.positionLevel || '',
        isOpen: target.position.isOpen === false ? 'false' : 'true',
        organizationUnitId: target.position.organizationUnitId || 'none',
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        organizationName: target.name,
        headcountAllocation: target.headcountAllocation === null ? '' : String(target.headcountAllocation),
      });
    }
  }, [target]);

  const update = (key: keyof EditForm, value: string) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const save = async () => {
    if (!target || isSaving) return;
    setIsSaving(true);
    try {
      let response: Response;
      if (target.type === 'position') {
        response = await fetch(`/api/positions/${target.position.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title.trim(),
            department: form.department.trim(),
            positionLevel: form.positionLevel.trim() || null,
            isOpen: form.isOpen === 'true',
            ...(form.organizationUnitId !== 'none' ? { organizationUnitId: form.organizationUnitId } : {}),
          }),
        });
      } else {
        const body = target.type === 'employee'
          ? {
            type: 'employee',
            id: target.employee.id,
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            jobTitle: form.jobTitle.trim() || null,
            status: form.status,
            location: form.location.trim() || null,
            managerId: form.managerId === 'none' ? null : form.managerId,
            departmentId: form.departmentId === 'none' ? null : form.departmentId,
          }
          : target.type === 'division'
            ? {
              type: 'division', id: target.id, currentName: target.name, name: form.organizationName.trim(),
              headcountAllocation: form.headcountAllocation === '' ? null : Number(form.headcountAllocation),
            }
            : {
              type: 'department', id: target.id,
              division: target.division,
              currentName: target.name,
              name: form.organizationName.trim(),
              headcountAllocation: form.headcountAllocation === '' ? null : Number(form.headcountAllocation),
            };
        response = await fetch('/api/hr/org-chart', {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      const payload = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to save changes.');
      await onSaved();
      toastSuccess('Organization chart updated.');
      onOpenChange(false);
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Unable to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const title = target?.type === 'employee'
    ? 'Edit employee'
    : target?.type === 'position'
      ? 'Edit position'
      : target?.type === 'division'
        ? 'Rename division'
        : 'Rename department';

  return (
    <Dialog open={Boolean(target)} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[8px] sm:max-w-[560px]" dialogId="org-chart-edit">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Changes are applied directly to the organization structure.</DialogDescription>
        </DialogHeader>

        {target?.type === 'employee' && (
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <Field label="First name"><Input value={form.firstName} onChange={event => update('firstName', event.target.value)} /></Field>
            <Field label="Last name"><Input value={form.lastName} onChange={event => update('lastName', event.target.value)} /></Field>
            <div className="sm:col-span-2"><Field label="Email"><Input type="email" value={form.email} onChange={event => update('email', event.target.value)} /></Field></div>
            <Field label="Job title"><Input value={form.jobTitle} onChange={event => update('jobTitle', event.target.value)} /></Field>
            <Field label="Location"><Input value={form.location} onChange={event => update('location', event.target.value)} /></Field>
            <Field label="Manager">
              <Select value={form.managerId} onValueChange={value => update('managerId', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No manager</SelectItem>
                  {employees
                    .filter(employee => employee.id !== target.employee.id)
                    .map(employee => (
                      <SelectItem key={employee.id} value={employee.id}>
                        <EmployeeOption name={[employee.firstName, employee.lastName].filter(Boolean).join(' ') || employee.email || 'Employee'} avatarUrl={employee.avatarUrl} detail={employee.jobTitle || undefined} />
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Organization unit">
              <Select value={form.departmentId} onValueChange={value => update('departmentId', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {units.map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.division} / {unit.department} / {unit.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={value => update('status', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="probation">Probation</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}

        {target?.type === 'position' && (
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label="Position title"><Input value={form.title} onChange={event => update('title', event.target.value)} /></Field></div>
            <Field label="Department"><Input value={form.department} onChange={event => update('department', event.target.value)} /></Field>
            <Field label="Organization unit">
              <Select value={form.organizationUnitId} onValueChange={value => update('organizationUnitId', value)}>
                <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Needs assignment</SelectItem>
                  {units.filter(unit => unit.unitType === 'unit' && unit.isActive).map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>{unit.division} / {unit.department} / {unit.section} / {unit.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Position level"><Input value={form.positionLevel} onChange={event => update('positionLevel', event.target.value)} /></Field>
            <Field label="Status">
              <Select value={form.isOpen} onValueChange={value => update('isOpen', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Open</SelectItem>
                  <SelectItem value="false">Closed</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}

        {(target?.type === 'division' || target?.type === 'department') && (
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <Field label={target.type === 'division' ? 'Division name' : 'Department name'}>
              <Input value={form.organizationName} onChange={event => update('organizationName', event.target.value)} />
            </Field>
            <Field label="Headcount allocation">
              <Input type="number" min={0} step={1} placeholder="Unlimited" value={form.headcountAllocation} onChange={event => update('headcountAllocation', event.target.value)} />
              <p className="text-xs text-muted-foreground">Reserved: {target.headcountUsage}. Blank is unlimited.</p>
            </Field>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button
            type="button"
            onClick={() => void save()}
            disabled={isSaving || !target || (
              target.type === 'employee'
                ? !form.firstName.trim() || !form.lastName.trim() || !form.email.trim()
                : target.type === 'position'
                  ? !form.title.trim() || !form.department.trim()
                  : !form.organizationName.trim()
            )}
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
