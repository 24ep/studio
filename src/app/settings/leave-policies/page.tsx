"use client";

import { useSession } from "next-auth/react";

import { hasAnyPermission } from "@/lib/permissions";
import { LeaveTypesTab } from "../data-configuration/LeaveTypesTab";
import { StandaloneConfigurationPage } from "../data-configuration/StandaloneConfigurationPage";

export default function LeavePoliciesPage() {
  const { data: session } = useSession();
  const canManage = hasAnyPermission(session?.user, ["HR_WORKFORCE_MANAGE"]);

  return (
    <StandaloneConfigurationPage>
      <LeaveTypesTab canManage={canManage} />
    </StandaloneConfigurationPage>
  );
}
