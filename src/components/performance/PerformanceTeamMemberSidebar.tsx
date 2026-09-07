"use client";

import * as React from "react";
import { RefreshCw, Search, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import type { PerformanceWorkspaceData } from "@/lib/performance/performance-contracts";
import { cn } from "@/lib/utils";

export function PerformanceTeamMemberSidebar({
  employees,
  selectedEmployeeId,
  loading,
  onSelectEmployee,
}: {
  employees: PerformanceWorkspaceData["employees"];
  selectedEmployeeId: string | null;
  loading: boolean;
  onSelectEmployee: (employeeId: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleEmployees = normalizedQuery
    ? employees.filter((employee) =>
        [
          employee.name,
          employee.employeeNumber,
          employee.jobTitle,
          employee.department,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedQuery),
        ),
      )
    : employees;

  return (
    <aside
      aria-label="Team members"
      className="hidden min-h-full overflow-hidden bg-background lg:flex lg:flex-col"
    >
      <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-950 dark:text-slate-50">
              Team members
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {employees.length} in your scope
            </p>
          </div>
          <Users
            className="h-5 w-5 text-[#3459a8] dark:text-blue-300"
            aria-hidden
          />
        </div>
        {employees.length > 5 ? (
          <div className="relative mt-3">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search members"
              aria-label="Search team members"
              className="h-9 pl-9"
            />
          </div>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {visibleEmployees.length ? (
          <div className="space-y-1">
            {visibleEmployees.map((member) => {
              const selected = member.id === selectedEmployeeId;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => onSelectEmployee(member.id)}
                  aria-current={selected ? "true" : undefined}
                  disabled={loading && selected}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3459a8]",
                    selected
                      ? "bg-[#eef3ff] text-[#263f73] dark:bg-blue-950/40 dark:text-blue-100"
                      : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900",
                  )}
                >
                  <Avatar className="h-9 w-9 shrink-0 rounded-full border border-slate-200 dark:border-slate-700">
                    {member.profilePhotoUrl ? (
                      <AvatarImage src={member.profilePhotoUrl} alt="" />
                    ) : null}
                    <AvatarFallback className="rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {initials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {member.name}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {member.jobTitle ||
                        member.department ||
                        member.employeeNumber}
                    </span>
                  </span>
                  {loading && selected ? (
                    <RefreshCw
                      className="h-4 w-4 shrink-0 animate-spin text-slate-400"
                      aria-label="Loading employee"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="px-3 py-8 text-center text-sm text-slate-500">
            No team members match your search.
          </p>
        )}
      </div>
    </aside>
  );
}

function initials(name?: string | null) {
  return String(name || "Employee")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
