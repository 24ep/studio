"use client";

import React from 'react';

interface OrganizationFooterProps {
  organizationName: string | null;
  organizationAddress: string | null;
  organizationContact: string | null;
}

export function OrganizationFooter({
  organizationName,
  organizationAddress,
  organizationContact,
}: OrganizationFooterProps) {
  return (
    <div className="mt-12 pt-4 border-t-2 border-border bg-muted/50 -mx-8 sm:-mx-12 px-4 sm:px-6 py-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex-1">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} All rights reserved{organizationName && <><span className="text-muted-foreground/60 mx-2">|</span>{organizationName}</>}
          </p>
        </div>
        <div className="text-left sm:text-right">
          {organizationAddress && (
            <p>{organizationAddress}</p>
          )}
          {organizationContact && (
            <p>{organizationContact}</p>
          )}
        </div>
      </div>
    </div>
  );
}

