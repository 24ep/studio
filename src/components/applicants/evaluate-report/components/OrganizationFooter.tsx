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
    <div className="mt-12 pt-4 border-t-2 border-gray-200 bg-gray-100 -mx-8 sm:-mx-12 px-4 sm:px-6 py-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-gray-600">
        <div className="flex-1">
          <p className="text-gray-600">
            © {new Date().getFullYear()} All rights reserved{organizationName && <><span className="text-gray-400 mx-2">|</span>{organizationName}</>}
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

