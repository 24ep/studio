"use client";

import { AtSign } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  normalizeEmployeeEmailDomain,
  sanitizeEmployeeEmailDomainInput,
} from '@/lib/employee-email-address';
import { SystemSettingsFieldRow } from './SystemSettingsFieldRow';

export default function DomainVerificationTab({
  employeeEmailDomain,
  isSaving,
  setEmployeeEmailDomain,
}: {
  employeeEmailDomain: string;
  isSaving: boolean;
  setEmployeeEmailDomain: (value: string) => void;
}) {
  const normalizedDomain = normalizeEmployeeEmailDomain(employeeEmailDomain);
  const hasInvalidDomain = Boolean(employeeEmailDomain && !normalizedDomain);

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <SystemSettingsFieldRow
          htmlFor="organization-employee-email-domain"
          label="Company Email Domain"
          description="Required for employee account creation. Enter the domain only, without @ or https://."
        >
          <div className="space-y-2">
            <div className="relative">
              <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="organization-employee-email-domain"
                value={employeeEmailDomain}
                onChange={event => setEmployeeEmailDomain(event.target.value.toLowerCase())}
                onBlur={event => setEmployeeEmailDomain(sanitizeEmployeeEmailDomainInput(event.target.value))}
                placeholder="company.com"
                disabled={isSaving}
                className="pl-9"
                inputMode="url"
                aria-describedby="organization-employee-email-domain-help"
              />
            </div>
            <p
              id="organization-employee-email-domain-help"
              className={hasInvalidDomain ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}
            >
              {hasInvalidDomain
                ? 'Enter a valid domain such as company.com.'
                : `Example: Jane Smith becomes jane.smi@${normalizedDomain || 'company.com'}.`}
            </p>
          </div>
        </SystemSettingsFieldRow>
      </div>
    </ScrollArea>
  );
}
